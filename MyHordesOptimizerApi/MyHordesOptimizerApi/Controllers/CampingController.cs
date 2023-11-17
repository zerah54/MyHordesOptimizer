using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
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
        [Route("CalculateCamping")]
        public ActionResult<int> PostCampingResult([FromBody] CampingParametersDto campingParameters)
        {
            Logger.LogDebug($"test + {campingParameters.ToString()}");
            return Ok(CampingService.CalculateCamping(campingParameters));
        }
    }
}
