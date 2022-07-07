using AStar;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
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

        [HttpPost]
        [Route("Planif")]
        public ActionResult<string> Planif()
        {
            var results = new List<string>();
            var redSouls = 0;
            //var min = 3275;
            //var max = 5400;
            //var min = 3406;
            //var min = 14000;
            //var max = 22225;
            var min = 3325;
            var max = 5675;
            var day = 19;
            var dayAttaque = day + 1;
            var max_ratio = 1;
            var ratio_min = dayAttaque <= 3 ? 0.66 : max_ratio;
            var ratio_max = dayAttaque <= 3 ? (dayAttaque <= 1 ? 0.4 : 0.66) : max_ratio;
            var attaqueMin = Math.Round(ratio_min * Math.Pow(Math.Max(1, dayAttaque - 1) * 0.75 + 2.5, 3));
            var attaqueMax = Math.Round(ratio_max * Math.Pow(dayAttaque * 0.75 + 3.5, 3));
            for (var attaque = attaqueMin; attaque <= attaqueMax; attaque++)
            {
                for (var k = 15; k <= 36; k++)
                {
                    var offsetMin = k;
                    var offsetMax = 48 - offsetMin;
                    var min2 = Math.Round(attaque - (attaque * offsetMin / 100));
                    var max2 = Math.Round(attaque + (attaque * offsetMax / 100));

                    min2 = Math.Floor(min2 / 25) * 25;
                    max2 = Math.Ceiling(max2 / 25) * 25;

                    var soulFactor = Math.Min(1 + (0.04 * redSouls), 1.2);

                    min2 = Math.Round(min2 * soulFactor);
                    max2 = Math.Round(max2 * soulFactor);

                    if (min == min2 && max == max2)
                    {
                        results.Add($"{min} - {max} : {attaque}");
                    }
                }
            }
            return Ok(results);
        }
    }
}
