using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
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

        public MyHordesOptimizerMapService(ILogger<MyHordesOptimizerMapService> logger,
            IServiceScopeFactory serviceScopeFactory,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            MhoContext dbContext)
        {
            Logger = logger;
            ServiceScopeFactory = serviceScopeFactory;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            DbContext = dbContext;
        }

        public LastUpdateInfoDto UpdateCell(int townId, MyHordesOptimizerCellUpdateDto updateRequest)
        {
            using var transaction = DbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            DbContext.SaveChanges();

            var cell = Mapper.Map<MapCell>(updateRequest);
            cell.IdTown = townId;
            cell.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            if (Convert.ToBoolean(cell.IsDryed)) 
            { 
                cell.AveragePotentialRemainingDig = 0; cell.MaxPotentialRemainingDig = 0; 
            }
            var cellItems = Mapper.Map<List<MapCellItem>>(updateRequest.Items);

            var cellModel = DbContext.MapCells
                .Include(cell => cell.MapCellItems)
                .Single(cell => cell.IdTown == townId && cell.X == updateRequest.X && cell.Y == updateRequest.Y);

            DbContext.MapCellItems.RemoveRange(cellModel.MapCellItems);
            DbContext.SaveChanges();
            cellModel.UpdateAllButKeysProperties(cell, ignoreNull: true);
            cellModel.MapCellItems = cellItems;

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
    }
}
