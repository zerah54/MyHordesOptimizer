using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.DailyProgram;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.DailyProgram
{
    /// <summary>Faits bruts du programme du jour, réservés aux citoyens de la ville ; aucune règle d'éligibilité.</summary>
    public class DailyProgramService : IDailyProgramService
    {
        private const string ReadyState = "ready";

        protected MhoContext DbContext { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected ITownAccessService TownAccessService { get; init; }
        protected IMapper Mapper { get; init; }

        public DailyProgramService(MhoContext dbContext, IUserInfoProvider userInfoProvider, ITownAccessService townAccessService, IMapper mapper)
        {
            DbContext = dbContext;
            UserInfoProvider = userInfoProvider;
            TownAccessService = townAccessService;
            Mapper = mapper;
        }

        public async Task<DailyProgramFactsDto> GetFactsAsync(int mapId, int day)
        {
            var idTown = DbContext.ResolveTownId(mapId);
            var facts = new DailyProgramFactsDto();
            if (!await DbContext.Towns.AsNoTracking().AnyAsync(town => town.IdTown == idTown)
                || !await TownAccessService.CanWriteTownAsync(idTown, mapId))
            {
                return facts;
            }
            var userId = UserInfoProvider.UserId;
            facts.IsCitizen = true;
            facts.HasEffectivePlan = await DbContext.TownBuildingPlans.AsNoTracking()
                .AnyAsync(plan => plan.IdTown == idTown && plan.Day == day && plan.IsEffective);
            facts.IsPlaced = await DbContext.ExpeditionCitizens.AsNoTracking()
                .AnyAsync(citizen => citizen.IdUser == userId
                    && citizen.IdExpeditionPartNavigation!.IdExpeditionNavigation!.IdTown == idTown
                    && citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.Day == day);

            // Résolution d'identité : le mapping des consignes remonte à la place et à l'expédition par navigation inverse.
            var openPlaces = await DbContext.ExpeditionCitizens.AsNoTrackingWithIdentityResolution()
                .Include(citizen => citizen.IdExpeditionPartNavigation)
                .Include(citizen => citizen.IdExpeditionBagNavigation)
                .Include(citizen => citizen.ExpeditionOrders)
                .Where(citizen => citizen.IdUser == null
                    && citizen.IdExpeditionPartNavigation!.IdExpeditionNavigation!.IdTown == idTown
                    && citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.Day == day
                    && citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.State == ReadyState
                    && citizen.IdExpeditionPartNavigation.Position == citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.ExpeditionParts.Min(part => part.Position))
                .ToListAsync();
            facts.OpenPlaces = Mapper.Map<List<ExpeditionCitizenDto>>(openPlaces);

            var me = await DbContext.GetTownCitizen(idTown).Where(citizen => citizen.IdUser == userId).SingleOrDefaultAsync();
            facts.Me = me is null ? null : Mapper.Map<CitizenDto>(me);
            return facts;
        }
    }
}
