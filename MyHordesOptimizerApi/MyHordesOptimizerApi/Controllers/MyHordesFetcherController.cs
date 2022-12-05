using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
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
        [Route("Town")]
        public ActionResult<Town> GetTown(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            UserKeyProvider.UserKey = userKey;
            var town = _myHordesFetcherService.GetTown();
            return town;
        }

        [HttpGet]
        [Route("Items")]
        public ActionResult<IEnumerable<Item>> GetItems(int? townId)
        {
            var items = _myHordesFetcherService.GetItems(townId).ToList();
            return items;
        }

        [HttpGet]
        [Route("Me")]
        public ActionResult<SimpleMe> GetMe(string userKey)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(userKey))
                {
                    return BadRequest($"{nameof(userKey)} cannot be empty");
                }
                UserKeyProvider.UserKey = userKey;
                var me = _myHordesFetcherService.GetSimpleMe();
                return me;
            }
            catch (Exception e)
            {
                return BadRequest(e.ToString());
            }
        }

        [HttpGet]
        [Route("HeroSkills")]
        public ActionResult<IEnumerable<HeroSkill>> GetHeroSkills()
        {      
            var heroSkills = _myHordesFetcherService.GetHeroSkills().ToList();
            return heroSkills;
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
        public ActionResult<BankWrapper> GetBank(string userKey)
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
        public ActionResult<CitizensWrapper> GetCitizens(int? townId, int? userId)
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
        public ActionResult<IEnumerable<MyHordesOptimizerRuin>> GetRuins()
        {
            var ruins = _myHordesFetcherService.GetRuins().ToList();
            return ruins;
        }

    }
}
