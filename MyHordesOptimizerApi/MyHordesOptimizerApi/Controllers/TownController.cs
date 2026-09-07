using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Caching;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Controllers
{
    [Controller]
    [Authorize]
    public class TownController : AbstractMyHordesOptimizerControllerBase
    {
        // Groupe B (voir chantier cache référentiels) : l'ensemble saisons/phases est dérivé de
        // Towns, écrite en continu, donc pas de point d'invalidation précis pour CE côté-là — TTL en
        // filet de sécurité. Mais IsFinished (AdminController.FinishSeason/UnfinishSeason) est lui un
        // point d'écriture identifiable : voir l'invalidation précise là-bas, la clé est donc partagée
        // via ReferentialCacheKeys plutôt que locale.
        private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(4);

        protected ITownService TownService { get; init; }
        private readonly IMemoryCache _cache;

        public TownController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userInfoProvider,
            ITownService townService,
            IMemoryCache cache) : base(logger, userInfoProvider)
        {
            TownService = townService;
            _cache = cache;
        }

        [HttpGet]
        [Route("{townId}/user/{userId}")]
        public ActionResult<CitizenDto> GetTownCitizen([FromRoute] int townId, [FromRoute] int userId)
        {
            var citizen = TownService.GetTownCitizen(townId, userId);
            return Ok(citizen);
        }

        [HttpPost]
        [Route("{townId}/user/{userId}/dailyAction/{actionKey}")]
        public ActionResult<LastUpdateInfoDto> AddCitizenDailyAction([FromRoute] int townId, [FromRoute] int userId, [FromRoute] string actionKey, [FromQuery] int? day)
        {
            if (string.IsNullOrEmpty(actionKey))
            {
                return BadRequest($"{nameof(actionKey)} must not be empty");
            }
            if (!day.HasValue)
            {
                return BadRequest($"{nameof(day)} must be > 0");
            }
            if (day < 1)
            {
                return BadRequest($"{nameof(day)} must be > 0");
            }
            var updatedCitizen = TownService.AddCitizenDailyAction(townId, userId, actionKey, day.Value);
            return Ok(updatedCitizen);

        }

        [HttpDelete]
        [Route("{townId}/user/{userId}/dailyAction/{actionKey}")]
        public ActionResult<CitizenDto> DeleteCitizenDailyAction([FromRoute] int townId, [FromRoute] int userId, [FromRoute] string actionKey, [FromQuery] int? day)
        {
            if (string.IsNullOrEmpty(actionKey))
            {
                return BadRequest($"{nameof(actionKey)} must not be empty");
            }
            if (!day.HasValue)
            {
                return BadRequest($"{nameof(day)} must be > 0");
            }
            if (day < 1)
            {
                return BadRequest($"{nameof(day)} must be > 0");
            }
            var updatedCitizen = TownService.DeleteCitizenDailyAction(townId, userId, actionKey, day.Value);
            return Ok(updatedCitizen);

        }

        [HttpPost]
        [Route("{townId}/user/{userId}/chamanicDetail")]
        public ActionResult<LastUpdateInfoDto> UpdateCitizenChamanicDetail([FromRoute] int townId, [FromRoute] int userId, [FromBody] CitizenChamanicDetailDto chamanicDetailDto)
        {
            var updatedCitizen = TownService.UpdateCitizenChamanicDetail(townId, userId, chamanicDetailDto);
            return Ok(updatedCitizen);

        }

        [HttpGet]
        [Route("list")]
        public ActionResult<TownListPageResultDto> GetTowns([FromQuery] TownListQueryDto query)
        {
            var towns = TownService.GetTowns(query);
            return Ok(towns);
        }

        [HttpGet]
        [Route("seasons")]
        public ActionResult<List<SeasonDto>> GetSeasons()
        {
            var seasons = _cache.GetOrCreate(ReferentialCacheKeys.Seasons, entry =>
            {
                entry.SetAbsoluteExpiration(CacheTtl);
                return TownService.GetSeasons();
            });
            return Ok(seasons);
        }

        [HttpGet]
        [Route("season-phases")]
        public ActionResult<List<SeasonPhaseDto>> GetSeasonPhases()
        {
            var seasonPhases = _cache.GetOrCreate(ReferentialCacheKeys.SeasonPhases, entry =>
            {
                entry.SetAbsoluteExpiration(CacheTtl);
                return TownService.GetSeasonPhases();
            });
            return Ok(seasonPhases);
        }
    }
}
