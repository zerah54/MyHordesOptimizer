using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class TownService : ITownService
    {
        protected ILogger<TownService> Logger { get; init; }
        protected IMapper Mapper { get; init; }
        protected MhoContext DbContext { get; init; }

        public TownService(ILogger<TownService> logger,
            IMapper mapper, 
            MhoContext dbContext)
        {
            Logger = logger;
            Mapper = mapper;
            DbContext = dbContext;
        }

        public CitizenDto GetTownCitizen(int townId, int userId)
        {
            var lastUpdateInfoId = DbContext.TownCitizens.Where(townCitizen => townCitizen.IdTown == townId).Max(tbi => tbi.IdLastUpdateInfo);
            var citizen = DbContext.TownCitizens.Where(townCitizen => townCitizen.IdTown == townId)
                .Where(townCitizen => townCitizen.IdUser == userId)
                .Where(townCitizen => townCitizen.IdLastUpdateInfo == lastUpdateInfoId
                || townCitizen.IdLastUpdateInfoGhoulStatus == lastUpdateInfoId
                || townCitizen.IdLastUpdateInfoHeroicAction == lastUpdateInfoId
                || townCitizen.IdLastUpdateInfoHome == lastUpdateInfoId
                || townCitizen.IdLastUpdateInfoStatus == lastUpdateInfoId)
                .Include(townCitizen => townCitizen.IdBagNavigation)
                    .ThenInclude(bag => bag.BagItems)
                        .ThenInclude(bagItem => bagItem.IdItemNavigation)
                .Include(townCitizen => townCitizen.IdBagNavigation)
                    .ThenInclude(bagItem => bagItem.IdLastUpdateInfoNavigation)
                        .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdLastUpdateInfoNavigation)
                    .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdLastUpdateInfoGhoulStatusNavigation)
                    .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdLastUpdateInfoHeroicActionNavigation)
                    .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdLastUpdateInfoHomeNavigation)
                    .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(townCitizen => townCitizen.IdLastUpdateInfoStatusNavigation)
                    .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                .Include(lastUpdate => lastUpdate.IdUserNavigation)
                .Single();
            var citizenDto = Mapper.Map<CitizenDto>(citizen);
            return citizenDto;
        }
    }
}
