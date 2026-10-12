using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Impl.Maps;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class MyHordesOptimizerMapService : IMyHordesOptimizerMapService
    {
        protected ILogger<MyHordesOptimizerMapService> Logger { get; private set; }
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }
        protected MhoContext DbContext { get; init; }
        protected TownSyncLock TownSyncLock { get; init; }
        protected IMyHordesScrutateurConfiguration MyHordesScrutateurConfiguration { get; init; }
        protected ITownAccessService TownAccessService { get; init; }
        protected IMyHordesCodeRepository MyHordesCodeRepository { get; init; }

        public MyHordesOptimizerMapService(ILogger<MyHordesOptimizerMapService> logger,
            IServiceScopeFactory serviceScopeFactory,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            MhoContext dbContext,
            TownSyncLock townSyncLock,
            IMyHordesScrutateurConfiguration myHordesScrutateurConfiguration,
            ITownAccessService townAccessService,
            IMyHordesCodeRepository myHordesCodeRepository)
        {
            Logger = logger;
            ServiceScopeFactory = serviceScopeFactory;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            DbContext = dbContext;
            TownSyncLock = townSyncLock;
            MyHordesScrutateurConfiguration = myHordesScrutateurConfiguration;
            TownAccessService = townAccessService;
            MyHordesCodeRepository = myHordesCodeRepository;
        }

        public LastUpdateInfoDto UpdateCell(int townId, MyHordesOptimizerCellUpdateDto updateRequest)
        {
            using var townLock = TownSyncLock.AcquireTownBlocking(-townId);
            var mapId = townId;
            townId = DbContext.ResolveTownId(townId);
            TownAccessService.EnsureCanWriteTown(townId, mapId);
            using var transaction = DbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            DbContext.SaveChanges();

            var cell = Mapper.Map<MapCell>(updateRequest);
            cell.IdTown = townId;
            cell.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            var cellItems = Mapper.Map<List<MapCellItem>>(updateRequest.Items);

            // Les relevés des métiers portent aussi sur les cases adjacentes : on charge
            // toute la ville pour pouvoir les mettre à jour au passage
            var townCells = DbContext.MapCells
                .Include(cell => cell.MapCellItems)
                .Where(cell => cell.IdTown == townId)
                .ToList();

            var cellModel = townCells.Single(cell => cell.X == updateRequest.X && cell.Y == updateRequest.Y);

            // Le formulaire renvoie tout l'état de la case : seul ce qui CHANGE est une observation.
            // Ressaisir à l'identique « non épuisée » ou un ancien niveau d'abondance ramènerait les
            // fouilles restantes dans une fourchette périmée.
            bool wasDryed = cellModel.IsDryed == true;
            int? previousScavZoneLevel = cellModel.ScavZoneLevel;

            DbContext.MapCellItems.RemoveRange(cellModel.MapCellItems);
            DbContext.SaveChanges();
            cellModel.UpdateAllButKeysProperties(cell, ignoreNull: true);
            cellModel.MapCellItems = cellItems;

            var town = DbContext.Towns.FirstOrDefault(town => town.IdTown == townId);
            var digObservations = town != null
                ? DigObservations.ForTown(DbContext, town, town.Day, MyHordesScrutateurConfiguration, () => townCells)
                : DigObservations.WithoutHistory(MyHordesScrutateurConfiguration);

            // Le formulaire a déjà recopié IsDryed : on le remet à sa valeur d'avant pour que
            // l'observation parte du vrai état précédent (une case vue vide puis déclarée non vide
            // prouve une régénération).
            if (cell.IsDryed == true && !wasDryed)
            {
                cellModel.IsDryed = false;
                digObservations.Observe(cellModel, DigBounds.Depleted);
            }
            else if (cell.IsDryed == false && wasDryed)
            {
                cellModel.IsDryed = true;
                digObservations.Observe(cellModel, DigBounds.NotDepleted);
            }

            townCells.ApplyJobRadars(digObservations,
                updateRequest.X,
                updateRequest.Y,
                updateRequest.ScavZoneLevel != previousScavZoneLevel ? updateRequest.ScavZoneLevel : null,
                updateRequest.ScoutZoneLevel,
                updateRequest.ScavNextCells,
                updateRequest.ScoutNextCells,
                newLastUpdate.IdLastUpdateInfo);

            var citizens = DbContext.TownCitizens.Where(x => x.IdTown == townId && updateRequest.Citizens.Contains(x.IdUser)).ToList();
            citizens.ForEach(citizen =>
            {
                citizen.PositionX = updateRequest.X;
                citizen.PositionY = updateRequest.Y;
            });

            DbContext.SaveChanges();
            transaction.Commit();
            return lastUpdateInfoDto;
        }

        /// <summary>
        /// Saisie de l'aménagement d'une zone pour le camping, datée du jour de la ville. Ne touche pas
        /// à la fraîcheur de la case (IdLastUpdateInfo) : ce n'est pas un relevé de son contenu.
        /// </summary>
        public CampImprovementDto UpdateCampImprovement(int townId, CampImprovementUpdateDto request)
        {
            using var townLock = TownSyncLock.AcquireTownBlocking(-townId);
            var mapId = townId;
            townId = DbContext.ResolveTownId(townId);
            TownAccessService.EnsureCanWriteTown(townId, mapId);

            var town = DbContext.Towns.FirstOrDefault(town => town.IdTown == townId)
                ?? throw new MhoTechnicalException($"Ville {mapId} inconnue.");
            var cell = DbContext.MapCells.FirstOrDefault(cell => cell.IdTown == townId && cell.X == request.X && cell.Y == request.Y)
                ?? throw new MhoTechnicalException($"Case [{request.X};{request.Y}] inconnue dans la ville {mapId}.");
            if (cell.IsTown == true)
            {
                throw new MhoTechnicalException("On ne campe pas en ville.");
            }

            var bonus = MyHordesCodeRepository.GetCampingBonus();
            var currentLevel = CampImprovement.CurrentLevel(cell.CampImprovementLevel, cell.CampImprovementDay, town.Day);
            cell.CampImprovementLevel = CampImprovement.Apply(currentLevel, request.Level, request.Improvements, request.DefenseObjects, bonus.Improve, bonus.ObjectImprove);
            cell.CampImprovementDay = town.Day;
            DbContext.SaveChanges();

            return new CampImprovementDto { Level = cell.CampImprovementLevel.Value, Day = town.Day };
        }
    }
}
