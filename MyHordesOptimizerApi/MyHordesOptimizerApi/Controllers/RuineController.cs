using AStar;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RuineController : AbstractMyHordesOptimizerControllerBase
    {
        private readonly IMyHordesRuineService _ruineService;

        public RuineController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, 
            IUserInfoProvider userKeyProvider,
            IMyHordesRuineService ruineService) : base(logger, userKeyProvider)
        {
            _ruineService = ruineService;
        }

        [HttpPost]
        [Route("PathOpti")]
        public ActionResult<List<Position>> PathOpti(RuineOptiPathRequestDto requestDto)
        {
            var path = _ruineService.OptimizeRuinePath(requestDto);
            return Ok(path);
        }
    }
}
