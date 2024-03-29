﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
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
