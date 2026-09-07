using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Controllers.ActionFillters;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Caching;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Buildings;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("Fetcher")]
    public class FetcherController : AbstractMyHordesOptimizerControllerBase
    {
        private readonly IMyHordesFetcherService _myHordesFetcherService;
        private readonly IMemoryCache _cache;

        public FetcherController(ILogger<FetcherController> logger,
            IMyHordesFetcherService myHordesFetcherService,
            IUserInfoProvider userKeyProvider,
            IMemoryCache cache) : base(logger, userKeyProvider)
        {
            _myHordesFetcherService = myHordesFetcherService;
            _cache = cache;
        }


        [HttpGet]
        [Route("Items")]
        public ActionResult<IEnumerable<ItemDto>> GetItems(int? townId)
        {
            // Le catalogue statique n'est mis en cache que sans townId : avec townId, la réponse
            // mélange le catalogue avec la banque/wishlist de la ville, volatiles.
            if (!townId.HasValue)
            {
                return _cache.GetOrCreate(ReferentialCacheKeys.Items,
                    _ => _myHordesFetcherService.GetItems(null).ToList());
            }

            var items = _myHordesFetcherService.GetItems(townId).ToList();
            return items;
        }

        [HttpGet]
        [Route("HeroSkills")]
        public ActionResult<IEnumerable<HeroSkillDto>> GetHeroSkills()
        {
            var heroSkills = _cache.GetOrCreate(ReferentialCacheKeys.HeroSkills,
                _ => _myHordesFetcherService.GetHeroSkills().ToList());
            return heroSkills;
        }

        [HttpGet]
        [Route("CausesOfDeath")]
        public ActionResult<IEnumerable<CauseOfDeathDto>> GetCausesOfDeath()
        {
            var causesOfDeath = _cache.GetOrCreate(ReferentialCacheKeys.CausesOfDeath,
                _ => _myHordesFetcherService.GetCausesOfDeath().ToList());
            return causesOfDeath;
        }

        [HttpGet]
        [Route("CleanUpTypes")]
        public ActionResult<IEnumerable<CleanUpTypeDto>> GetCleanUpTypes()
        {
            var cleanUpTypes = _cache.GetOrCreate(ReferentialCacheKeys.CleanUpTypes,
                _ => _myHordesFetcherService.GetCleanUpTypes().ToList());
            return cleanUpTypes;
        }

        [HttpGet]
        [Route("Recipes")]
        public ActionResult<IEnumerable<ItemRecipeDto>> GetRecipes()
        {
            var recipes = _cache.GetOrCreate(ReferentialCacheKeys.Recipes,
                _ => _myHordesFetcherService.GetRecipes().ToList());
            return recipes;
        }

        [HttpGet]
        [Route("Bank")]
        [Authorize]
        [TypeFilter(typeof(ETagCacheFilter), Arguments = new object[] { ETagResource.Bank, "townId" })]
        public ActionResult<BankLastUpdateDto> GetBank(int? townId)
        {
            // Avec townId : lecture pure en base (mode observateur), sans synchro MyHordes
            var bank = townId.HasValue
                ? _myHordesFetcherService.GetBank(townId.Value)
                : _myHordesFetcherService.GetBank();
            return bank;
        }


        [HttpGet]
        [Route("Citizens")]
        [TypeFilter(typeof(ETagCacheFilter), Arguments = new object[] { ETagResource.Citizens, "townId" })]
        public ActionResult<CitizensLastUpdateDto> GetCitizens(int? townId, int? userId)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }

            if (!userId.HasValue)
            {
                return BadRequest($"{nameof(userId)} cannot be empty");
            }

            UserInfoProvider.UserId = userId.Value;
            var citizens = _myHordesFetcherService.GetCitizens(townId.Value);
            return citizens;
        }

        [HttpGet]
        [Route("Ruins")]
        public ActionResult<IEnumerable<MyHordesOptimizerRuinDto>> GetRuins(int? townId)
        {
            // Comme GetItems : avec townId, la réponse inclut les cases de carte de la ville, volatiles.
            if (!townId.HasValue)
            {
                return _cache.GetOrCreate(ReferentialCacheKeys.Ruins,
                    _ => _myHordesFetcherService.GetRuins(null).ToList());
            }

            var ruins = _myHordesFetcherService.GetRuins(townId).ToList();
            return ruins;
        }

        /// <summary>
        /// Référentiel des chantiers de ville. Aucun paramètre de ville : ce sont les prototypes.
        /// Les coûts sont ceux du jeu de ressources par défaut — voir <c>GetBuildings</c>.
        /// </summary>
        [HttpGet]
        [Route("Buildings")]
        public ActionResult<IEnumerable<BuildingDto>> GetBuildings()
        {
            return _cache.GetOrCreate(ReferentialCacheKeys.Buildings,
                _ => _myHordesFetcherService.GetBuildings().ToList());
        }

        [HttpGet]
        [Route("Map")]
        [TypeFilter(typeof(ETagCacheFilter), Arguments = new object[] { ETagResource.Map, "townId" })]
        public ActionResult<MyHordesOptimizerMapDto> GetMap(int? townId)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }

            var map = _myHordesFetcherService.GetMap(townId.Value);
            return map;
        }

        [HttpGet]
        [Route("MapDigs")]
        [TypeFilter(typeof(ETagCacheFilter), Arguments = new object[] { ETagResource.MapDigs, "townId" })]
        public ActionResult<IEnumerable<MyHordesOptimizerMapDigDto>> GetMapDigs(int? townId)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }

            var digs = _myHordesFetcherService.GetMapDigs(townId.Value).ToList();
            return digs;
        }


        [HttpPost]
        [Route("MapDigs")]
        public ActionResult<List<MyHordesOptimizerMapDigDto>> CreaterOrUpdateMapDig([FromQuery] int? townId,
            [FromQuery] int? userId, [FromBody] List<MyHordesOptimizerMapDigDto> requests)
        {
            if (!userId.HasValue)
            {
                return BadRequest($"{nameof(userId)} cannot be empty");
            }

            if (!userId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }

            if (requests == null || !requests.Any() || (requests.Any(x => x.CellId == 0) && townId == null))
            {
                return BadRequest($"{nameof(townId)} cannot be empty when no cellId is provided");
            }

            UserInfoProvider.UserId = userId.Value;
            var dto = _myHordesFetcherService.CreateOrUpdateMapDigs(townId.Value, userId.Value, requests);
            return Ok(dto);
        }

        [HttpDelete]
        [Route("MapDigs")]
        public ActionResult<LastUpdateInfoDto> CreaterOrUpdateMapDig([FromQuery] int? idCell, [FromQuery] int? diggerId,
            [FromQuery] int? day)
        {
            if (!idCell.HasValue)
            {
                return BadRequest($"{nameof(idCell)} cannot be empty");
            }

            if (!diggerId.HasValue)
            {
                return BadRequest($"{nameof(diggerId)} cannot be empty");
            }

            if (!day.HasValue)
            {
                return BadRequest($"{nameof(day)} cannot be empty");
            }

            _myHordesFetcherService.DeleteMapDigs(idCell.Value, diggerId.Value, day.Value);
            return Ok();
        }

        [HttpGet]
        [Route("MapUpdates")]
        public ActionResult<IEnumerable<MyHordesOptimizerMapUpdateDto>> GetMapUpdates(int? townId)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }

            var updates = _myHordesFetcherService.GetMapUpdates(townId.Value).ToList();
            return updates;
        }
    }
}
