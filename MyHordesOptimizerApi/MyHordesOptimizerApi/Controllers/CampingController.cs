using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using AutoMapper;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CampingController : AbstractMyHordesOptimizerControllerBase
    {
        protected ICampingService CampingService { get; private set; }

        public CampingController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userKeyProvider,
            ICampingService campingService) : base(logger, userKeyProvider)
        {
            CampingService = campingService;
        }

        [HttpPost]
        [Route("Calculate")]
        public ActionResult<CampingOddsDto> PostCampingResult([FromBody] CampingParametersDto campingParameters)
        {
            Logger.LogDebug($"test + {campingParameters.ToString()}");
            return Ok(CampingService.CalculateCamping(campingParameters));
        }

        /// <summary>
        /// Chances de plusieurs campeurs d'une même zone dans l'ordre où ils se cachent, et l'ordre qui
        /// maximise les survivants attendus.
        /// </summary>
        [HttpPost]
        [Route("CalculateGroup")]
        public ActionResult<CampingGroupResultDto> PostCampingGroup([FromBody] CampingGroupParametersDto group)
        {
            if (group?.Campers == null
                || group.Campers.Count == 0
                || group.Campers.Count > CampingGroupParametersDto.MaxCampers
                || group.Campers.Any(camper => camper == null || camper.Campings < 0 || camper.Objects < 0
                    || !CitizenHeroSkillLevelsDto.IsValidLevel(camper.RecluseLevel))
                || group.Distance < 0
                || group.Zombies < 0
                || group.HiddenCampers < 0
                || group.ImprovementLevel < 0
                || group.RuinBuryCount < 0)
            {
                return BadRequest("Invalid camping group");
            }
            return Ok(CampingService.CalculateGroup(group));
        }

        [HttpGet]
        [Route("Bonus")]
        public ActionResult<int> GetCampingBonus()
        {
            return Ok(CampingService.GetBonus());
        }

        [HttpGet]
        [Route("Results")]
        public ActionResult<int> GetCampingResults()
        {
            return Ok(CampingService.GetResults());
        }
    }
}
