using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class TownService : ITownService
    {
        protected ILogger<TownService> Logger { get; init; }
        protected IMapper Mapper { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected MhoContext DbContext { get; init; }

        public TownService(ILogger<TownService> logger,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            MhoContext dbContext)
        {
            Logger = logger;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            DbContext = dbContext;
        }

        public CitizenDto GetTownCitizen(int townId, int userId)
        {
            var citizen = DbContext.GetTownCitizen(townId)
                .Where(townCitizen => townCitizen.IdUser == userId)
                .SingleOrDefault();
            if (citizen == null)
            {
                var cadaver = DbContext.TownCadavers.Where(cadaver => cadaver.IdTown == townId)
                    .Where(cadaver => cadaver.IdUser == userId)
                    .Include(cadaver => cadaver.IdUserNavigation)
                    .FirstOrDefault();
                if (cadaver is null)
                {
                    throw new MhoTechnicalException($"Aucun citizen ou cadavre trouvé pour la ville {townId} et l'utilisateur {userId}");
                }
                else
                {
                    throw new MhoFunctionalException($"Le citoyen {cadaver.IdUserNavigation.Name} est décédé !", FunctionErrorCode.DeadCitizen);
                }
            }
            var citizenDto = Mapper.Map<CitizenDto>(citizen);
            return citizenDto;
        }

        public LastUpdateInfoDto AddCitizenBath(int townId, int userId, int day)
        {
            var bath = DbContext.TownCitizenBaths
                .Where(townCitizenBath => townCitizenBath.IdTown == townId)
                .Where(townCitizenBath => townCitizenBath.IdUser == userId)
                .Where(townCitizenBath => townCitizenBath.Day == day)
                .Include(townCitizenBath => townCitizenBath.IdLastUpdateInfoNavigation)
                    .ThenInclude(lastUpdateInfo => lastUpdateInfo.IdUserNavigation)
                .FirstOrDefault();
            LastUpdateInfoDto result;
            if (bath == null)
            {
                DbContext.ChangeTracker.Clear();
                using var transaction = DbContext.Database.BeginTransaction();
                var lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
                result = lastUpdateInfoDto;
                var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
                DbContext.SaveChanges();
                DbContext.ChangeTracker.Clear();
                bath = new TownCitizenBath()
                {
                    Day = day,
                    IdUser = userId,
                    IdTown = townId,
                    IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo
                };
                DbContext.Add(bath);
                DbContext.SaveChanges();
                transaction.Commit();
            }
            else
            {
                result = Mapper.Map<LastUpdateInfoDto>(bath.IdLastUpdateInfoNavigation);
            }
            return result;
        }

        public CitizenDto DeleteCitizenBath(int townId, int userId, int day)
        {
            var bath = DbContext.TownCitizenBaths
               .Where(townCitizenBath => townCitizenBath.IdTown == townId)
               .Where(townCitizenBath => townCitizenBath.IdUser == userId)
               .Where(townCitizenBath => townCitizenBath.Day == day)
               .FirstOrDefault();
            if (bath != null)
            {
                DbContext.Remove(bath);
                DbContext.SaveChanges();
            }
            return GetTownCitizen(townId, userId);
        }

        public LastUpdateInfoDto UpdateCitizenChamanicDetail(int townId, int userId, CitizenChamanicDetailDto chamanicDetailDto)
        {
            var citizen = DbContext.TownCitizens.Where(townCitizen => townCitizen.IdTown == townId)
                 .Where(townCitizen => townCitizen.IdUser == userId)
                 .Include(townCitizen => townCitizen.IdLastUpdateChamanicNavigation)
                 .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                 .Single();
            DbContext.ChangeTracker.Clear();

            using var transaction = DbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            DbContext.SaveChanges();
            DbContext.ChangeTracker.Clear();

            citizen.IsImmuneToSoul = chamanicDetailDto.IsImmuneToSoul;
            citizen.NbPotionChamanique = chamanicDetailDto.NbPotionChaman;
            citizen.IdLastUpdateChamanic = newLastUpdate.IdLastUpdateInfo;
            DbContext.Update(citizen);
            DbContext.SaveChanges();
            transaction.Commit();

            return lastUpdateInfoDto;
        }
    }
}
