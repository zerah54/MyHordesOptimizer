using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("Fetcher")]
    public class MyHordesFetcherController : AbstractMyHordesOptimizerControllerBase
    {
        private readonly IMyHordesFetcherService _myHordesFetcherService;

        public MyHordesFetcherController(ILogger<MyHordesFetcherController> logger,
            IMyHordesFetcherService myHordesFetcherService,
            IUserInfoProvider userKeyProvider) : base(logger, userKeyProvider)
        {
            _myHordesFetcherService = myHordesFetcherService;
        }


        [HttpGet]
        [Route("Items")]
        public ActionResult<IEnumerable<Item>> GetItems(int? townId)
        {
            var items = _myHordesFetcherService.GetItems(townId).ToList();
            return items;
        }

        [HttpGet]
        [Route("HeroSkills")]
        public ActionResult<IEnumerable<HeroSkill>> GetHeroSkills()
        {
            var heroSkills = _myHordesFetcherService.GetHeroSkills().ToList();
            return heroSkills;
        }

        [HttpGet]
        [Route("CausesOfDeath")]
        public ActionResult<IEnumerable<CauseOfDeath>> GetCausesOfDeath()
        {
            var causesOfDeath = _myHordesFetcherService.GetCausesOfDeath().ToList();
            return causesOfDeath;
        }

        [HttpGet]
        [Route("CleanUpTypes")]
        public ActionResult<IEnumerable<CleanUpType>> GetCleanUpTypes()
        {
            var cleanUpTypes = _myHordesFetcherService.GetCleanUpTypes().ToList();
            return cleanUpTypes;
        }

        [HttpGet]
        [Route("Recipes")]
        public ActionResult<IEnumerable<ItemRecipe>> GetRecipes()
        {
            var recipes = _myHordesFetcherService.GetRecipes().ToList();
            return recipes;
        }

        [HttpGet]
        [Route("Bank")]
        public ActionResult<BankLastUpdate> GetBank(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }

            UserKeyProvider.UserKey = userKey;
            var bank = _myHordesFetcherService.GetBank();
            return bank;
        }


        [HttpGet]
        [Route("Citizens")]
        public ActionResult<CitizensLastUpdate> GetCitizens(int? townId, int? userId)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }

            if (!userId.HasValue)
            {
                return BadRequest($"{nameof(userId)} cannot be empty");
            }

            UserKeyProvider.UserId = userId.Value;
            var citizens = _myHordesFetcherService.GetCitizens(townId.Value);
            return citizens;
        }

        [HttpGet]
        [Route("Ruins")]
        public ActionResult<IEnumerable<MyHordesOptimizerRuin>> GetRuins(int? townId)
        {
            var ruins = _myHordesFetcherService.GetRuins(townId).ToList();
            return ruins;
        }

        [HttpGet]
        [Route("Map")]
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

            UserKeyProvider.UserId = userId.Value;
            var dto = _myHordesFetcherService.CreateOrUpdateMapDigs(townId, userId.Value, requests);
            return Ok(dto);
        }

        [HttpDelete]
        [Route("MapDigs")]
        public ActionResult<LastUpdateInfo> CreaterOrUpdateMapDig([FromQuery] int? idCell, [FromQuery] int? diggerId,
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