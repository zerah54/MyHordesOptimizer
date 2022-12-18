
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [BasicAuthentication]
    [Route("[controller]")]
    public class AttaqueEstimationController : AbstractMyHordesOptimizerControllerBase
    {
        public AttaqueEstimationController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, IUserInfoProvider userKeyProvider) : base(logger, userKeyProvider)
        {
        }

        [HttpPost]
        [Route("PlanifClassique")]
        public ActionResult<string> PlanifClassique(AttaqueEstimationRequest request)
        {
            var offsetMinInit = 15;
            var offsetMaxInit = 36;
            var results = new List<double>();
            var redSouls = request.RedSouls;
            var min = request.Min;
            var max = request.Max;
            var day = request.Day;
            var dayAttaque = day + 1;
            var max_ratio = 1;
            var ratio_min = dayAttaque <= 3 ? 0.66 : max_ratio;
            var ratio_max = dayAttaque <= 3 ? (dayAttaque <= 1 ? 0.4 : 0.66) : max_ratio;
            var attaqueMin = Math.Round(ratio_min * Math.Pow(Math.Max(1, dayAttaque - 1) * 0.75 + 2.5, 3));
            var attaqueMax = Math.Round(ratio_max * Math.Pow(dayAttaque * 0.75 + 3.5, 3));
            for (var attaque = attaqueMin; attaque <= attaqueMax; attaque++)
            {
                for (var k = offsetMinInit; k <= offsetMaxInit; k++)
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
                        results.Add(attaque);
                    }
                }
            }
            return Ok($"[{results.Min()}-{results.Max()}]");
        }

        [HttpPost]
        [Route("Planif")]
        public ActionResult<string> Planif(AttaqueEstimationRequest request)
        {
            var resultPerOffsetTuple = new Dictionary<OffsetTuple, List<double>>();

            var allOffsetMinPossible = new List<int>();
            var allShiftPossible = new List<int>();
            var allVariancePossible = new List<int>();
            if (request.UseDefaultOffsets)
            {
                allOffsetMinPossible.AddRange(Enumerable.Range(15, 36 - 15));
                allShiftPossible.Add(0);
                allVariancePossible.Add(48);
            }
            else
            {
                var startOffsetMin = 0;
                var stopOffsetMin = 70;
                allOffsetMinPossible.AddRange(Enumerable.Range(startOffsetMin, stopOffsetMin - startOffsetMin + 1));

                var startShift = 0;
                var stopShift = 10;
                allShiftPossible.AddRange(Enumerable.Range(startShift, stopShift - startShift + 1));

                var startVariance = 48 - 10;
                var stopVariance = 48 + 10;
                allVariancePossible.AddRange(Enumerable.Range(startVariance, stopVariance - startVariance + 1));
            //    allShiftPossible.Add(10);
            //    allVariancePossible.Add(58);
            }

            var results = new List<double>();
            var redSouls = request.RedSouls;
            var min = request.Min;
            var max = request.Max;
            var day = request.Day;
            var dayAttaque = day + 1;
            var max_ratio = 1;
            var ratio_min = dayAttaque <= 3 ? 0.66 : max_ratio;
            var ratio_max = dayAttaque <= 3 ? (dayAttaque <= 1 ? 0.4 : 0.66) : max_ratio;
            var attaqueMin = Math.Round(ratio_min * Math.Pow(Math.Max(1, dayAttaque - 1) * 0.75 + 2.5, 3));
            var attaqueMax = Math.Round(ratio_max * Math.Pow(dayAttaque * 0.75 + 3.5, 3));

            var resultBuilder = new StringBuilder();
            var minEver = double.MaxValue;
            var maxEver = double.MinValue;

            foreach (var offsetMin in allOffsetMinPossible)
            {
                foreach (var variance in allVariancePossible)
                {
                    foreach (var shift in allShiftPossible)
                    {
                        var offsetMax = variance - (2 * shift) - offsetMin;

                        for (var attaque = attaqueMin; attaque <= attaqueMax; attaque++)
                        {
                            var min2 = Math.Round(attaque - (attaque * offsetMin / 100));
                            var max2 = Math.Round(attaque + (attaque * offsetMax / 100));

                            min2 = Math.Floor(min2 / 25) * 25;
                            max2 = Math.Ceiling(max2 / 25) * 25;

                            var soulFactor = Math.Min(1 + (0.04 * redSouls), 1.2);

                            min2 = Math.Round(min2 * soulFactor);
                            max2 = Math.Round(max2 * soulFactor);

                            if (min == min2 && max == max2)
                            {
                                results.Add(attaque);
                                if(attaque < minEver)
                                {
                                    minEver = attaque;
                                }
                                if(attaque > maxEver)
                                {
                                    maxEver = attaque;
                                }
                            }
                        }
                        if (results.Any())
                        {
                            resultPerOffsetTuple.Add(new OffsetTuple(offsetMin, shift, variance), results);
                            resultBuilder.AppendLine($"Tuple : {{{offsetMin}, {shift}, {variance}}} : {results.Min()} - {results.Max()}");
                        }
                    }
                }
            }

            resultBuilder.Insert(0, $"Total range : {minEver} - {maxEver} {Environment.NewLine}");
            return Ok(resultBuilder.ToString());
        }
    }

    internal class OffsetTuple
    {
        public int OffsetMin { get; set; }
        public int Shift { get; set; }
        public int Variance { get; set; }

        public OffsetTuple(int offsetMin, int shift, int variance)
        {
            OffsetMin = offsetMin;
            Shift = shift;
            Variance = variance;
        }
    }
}
