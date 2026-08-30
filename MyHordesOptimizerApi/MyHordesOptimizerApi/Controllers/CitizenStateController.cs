using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.CitizenState;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models.CitizenState;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CitizenStateController : AbstractMyHordesOptimizerControllerBase
    {
        protected ICitizenDayStateEngine StateEngine { get; private set; }
        protected IMyHordesFetcherService Fetcher { get; private set; }
        protected ICitizenStateOrderRankingEngine RankingEngine { get; private set; }

        public CitizenStateController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userInfoProvider,
            ICitizenDayStateEngine stateEngine,
            IMyHordesFetcherService fetcher,
            ICitizenStateOrderRankingEngine rankingEngine) : base(logger, userInfoProvider)
        {
            StateEngine = stateEngine;
            Fetcher = fetcher;
            RankingEngine = rankingEngine;
        }

        [HttpGet]
        [Route("ItemsWithStateImpact")]
        public ActionResult<List<string>> GetItemsWithStateImpact()
        {
            return Ok(Fetcher.GetItemUidsWithCitizenStateImpact().ToList());
        }

        [HttpPost]
        [Route("CitizenDay")]
        public ActionResult<CitizenStateTraceDto> PostCitizenDayState([FromBody] CitizenDayStateRequestDto request)
        {
            var steps = new List<CitizenStateStep>();
            foreach (var stepDto in request.Steps)
            {
                var step = ToModel(stepDto);
                if (step is null) return BadRequest($"Étape invalide : type='{stepDto.Type}'");
                steps.Add(step);
            }

            var trace = StateEngine.Simulate(ToModel(request.StartingState), steps);

            return Ok(ToDto(trace));
        }

        [HttpPost]
        [Route("RankOrders")]
        public ActionResult<List<RankedOrderDto>> PostRankOrders([FromBody] SuggestOrderRequestDto request)
        {
            var ranked = RankingEngine.RankOrders(ToModel(request.StartingState), request.BagItemIds);
            return Ok(ranked.Select(r => new RankedOrderDto
            {
                Order = r.Order,
                Tier = r.Tier.ToString().ToLowerInvariant(),
                TierReachedAtDistance = r.TierReachedAtDistance,
                TotalDistance = r.TotalDistance,
                FinalState = ToDto(r.FinalState),
            }).ToList());
        }

        private static Models.CitizenState.CitizenState ToModel(CitizenStateDto dto) => new Models.CitizenState.CitizenState
        {
            Ap = dto.Ap,
            Sp = dto.Sp,
            Wounded = dto.Wounded,
            IsEclaireur = dto.IsEclaireur,
            HasBike = dto.HasBike,
            HasShoes = dto.HasShoes,
            WalkingDistance = dto.WalkingDistance,
            IsDead = dto.IsDead,
            Statuses = new HashSet<string>(dto.Statuses),
            HasShield = dto.HasShield,
            HasDefenceCpItem = dto.HasDefenceCpItem,
            IsGuide = dto.IsGuide,
            ZoneCitizenCount = dto.ZoneCitizenCount,
            HasCleanPdcPerk = dto.HasCleanPdcPerk,
            HasHydratedPdcPerk = dto.HasHydratedPdcPerk,
            HasSoberPdcPerk = dto.HasSoberPdcPerk,
            HasBaseZoneControlPerk = dto.HasBaseZoneControlPerk,
            IsRoleGhoul = dto.IsRoleGhoul,
        };

        private static CitizenStateStep? ToModel(CitizenStateStepDto dto) => dto.Type switch
        {
            "item" when dto.ItemId is not null => new ItemActionStep { ItemId = dto.ItemId.Value },
            "move" when dto.IsNearZone is not null => new MoveStep { IsNearZone = dto.IsNearZone.Value },
            "equip_shoes" => new EquipShoesStep(),
            "mount_bike" => new MountBikeStep(),
            "dismount_bike" => new DismountBikeStep(),
            "pickup_defence_cp_item" => new PickupDefenceCpItemStep(),
            "become_ghoul" => new BecomeGhoulStep(),
            _ => null,
        };

        private static CitizenStateDto ToDto(Models.CitizenState.CitizenState state) => new CitizenStateDto
        {
            Ap = state.Ap,
            Sp = state.Sp,
            Wounded = state.Wounded,
            IsEclaireur = state.IsEclaireur,
            HasBike = state.HasBike,
            HasShoes = state.HasShoes,
            WalkingDistance = state.WalkingDistance,
            IsDead = state.IsDead,
            Statuses = state.Statuses.ToList(),
            HasShield = state.HasShield,
            HasDefenceCpItem = state.HasDefenceCpItem,
            IsGuide = state.IsGuide,
            ZoneCitizenCount = state.ZoneCitizenCount,
            HasCleanPdcPerk = state.HasCleanPdcPerk,
            HasHydratedPdcPerk = state.HasHydratedPdcPerk,
            HasSoberPdcPerk = state.HasSoberPdcPerk,
            HasBaseZoneControlPerk = state.HasBaseZoneControlPerk,
            IsRoleGhoul = state.IsRoleGhoul,
            Pdc = CitizenPdcRules.ComputeCurrentPdc(state),
        };

        private static CitizenStateTraceDto ToDto(CitizenStateTrace trace) => new CitizenStateTraceDto
        {
            StartingState = ToDto(trace.StartingState),
            Steps = trace.Steps.Select(s => new CitizenStateStepResultDto
            {
                Description = s.Description,
                StateAfter = ToDto(s.StateAfter),
            }).ToList(),
        };
    }
}
