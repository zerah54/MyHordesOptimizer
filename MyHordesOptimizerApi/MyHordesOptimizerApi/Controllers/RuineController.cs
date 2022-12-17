using AStar;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
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
        [Route("Attaque")]
        public ActionResult<string> Attaque([FromBody] AttaqueInputDto input)
        {
            ReleveEstimation inputEstimation = GetReleveEstimationFromInput(input);

            var results = new List<string>();
            var redSouls = 0;
            var day = 1;
            var max_ratio = 1;
            var ratio_min = day <= 3 ? 0.66 : max_ratio;
            var ratio_max = day <= 3 ? (day <= 1 ? 0.4 : 0.66) : max_ratio;
            var attaqueMin = Math.Round(ratio_min * Math.Pow(Math.Max(1, day - 1) * 0.75 + 2.5, 3));
            var attaqueMax = Math.Round(ratio_max * Math.Pow(day * 0.75 + 3.5, 3));

            var estimationsPossible = new Dictionary<EstimationKey, List<ReleveEstimation>>();
            for (var attaque = inputEstimation.Min100; attaque <= inputEstimation.Max100; attaque++)
            {
                for (var offsetMin = 15; offsetMin <= 36; offsetMin++)
                {
                    var offsetMax = 48 - offsetMin;
                    var key = new EstimationKey()
                    {
                        Attaque = attaque.Value,
                        OffSetMinInitial = offsetMin,
                        OffSetMaxInitial = offsetMax,
                    };
                    var estimations = new List<ReleveEstimation>();
                    estimationsPossible.Add(key, estimations);
                    for (var passage = 8; passage <= 24; passage++) // passage 8 = estimation 33%
                    {
                        if (ShouldBreakOnMin(passage, estimations, inputEstimation))
                        {
                            break;
                        }
                        var offSetMinBorneMin = offsetMin - 2 * passage;
                        var offSetMaxBornMin = offsetMax - 2 * passage;
                        for (double offsetMinPossible = offSetMaxBornMin; offsetMinPossible <= offsetMin && offsetMinPossible > 3; offsetMinPossible += 0.001)
                        {
                            //  for (double offsetMaxPossible = offSetMaxBornMin; offsetMaxPossible <= offsetMax && offsetMaxPossible > 3; offsetMaxPossible += 0.001)
                            //   {
                            double quality = passage / 24.0;

                            var releve = estimations.Where(x => x.OffsetMinPossible == offsetMinPossible/* && x.OffsetMaxPossible == offsetMaxPossible*/).FirstOrDefault();
                            if (releve == null)
                            {
                                releve = new ReleveEstimation()
                                {
                                    OffsetMinPossible = offsetMinPossible,
                                    //         OffsetMaxPossible = offsetMaxPossible
                                };
                                estimations.Add(releve);
                            }



                            var estimationMin = Math.Round(attaque.Value - (attaque.Value * offsetMinPossible / 100));
                            //    var estimationMax = Math.Round(attaque + (attaque * offsetMaxPossible / 100));

                           // estimationMin = Math.Floor(estimationMin / 25) * 25;
                            //   estimationMax = Math.Ceiling(estimationMax / 25) * 25;

                            var soulFactor = Math.Min(1 + (0.04 * redSouls), 1.2);

                            estimationMin = Math.Round(estimationMin * soulFactor);
                            //    estimationMax = Math.Round(estimationMax * soulFactor);
                            double? estimationMax = null;
                            switch (passage)
                            {
                                case 8:
                                    releve.Min33 = estimationMin;
                                    releve.Max33 = estimationMax;
                                    break;
                                case 9:
                                    releve.Min38 = estimationMin;
                                    releve.Max38 = estimationMax;
                                    break;
                                case 10:
                                    releve.Min42 = estimationMin;
                                    releve.Max42 = estimationMax;
                                    break;
                                case 11:
                                    releve.Min46 = estimationMin;
                                    releve.Max46 = estimationMax;
                                    break;
                                case 12:
                                    releve.Min50 = estimationMin;
                                    releve.Max50 = estimationMax;
                                    break;
                                case 13:
                                    releve.Min54 = estimationMin;
                                    releve.Max54 = estimationMax;
                                    break;
                                case 14:
                                    releve.Min58 = estimationMin;
                                    releve.Max58 = estimationMax;
                                    break;
                                case 15:
                                    releve.Min63 = estimationMin;
                                    releve.Max63 = estimationMax;
                                    break;
                                case 16:
                                    releve.Min67 = estimationMin;
                                    releve.Max67 = estimationMax;
                                    break;
                                case 17:
                                    releve.Min71 = estimationMin;
                                    releve.Max71 = estimationMax;
                                    break;
                                case 18:
                                    releve.Min75 = estimationMin;
                                    releve.Max75 = estimationMax;
                                    break;
                                case 19:
                                    releve.Min79 = estimationMin;
                                    releve.Max79 = estimationMax;
                                    break;
                                case 20:
                                    releve.Min83 = estimationMin;
                                    releve.Max83 = estimationMax;
                                    break;
                                case 21:
                                    releve.Min88 = estimationMin;
                                    releve.Max88 = estimationMax;
                                    break;
                                case 22:
                                    releve.Min92 = estimationMin;
                                    releve.Max92 = estimationMax;
                                    break;
                                case 23:
                                    releve.Min96 = estimationMin;
                                    releve.Max96 = estimationMax;
                                    break;
                                case 24:
                                    releve.Min100 = estimationMin;
                                    releve.Max100 = estimationMax;
                                    break;
                                default:
                                    break;
                            }
                            //}
                        }
                    }
                }
            }
            var attaques = estimationsPossible.Where(x => x.Value.Any(estim => estim.CompareOnMin(inputEstimation))).Select(x => x.Key.Attaque).ToList();
            return Ok(attaques);
        }

        private bool ShouldBreakOnMin(int passage, List<ReleveEstimation> estimations, ReleveEstimation inputEstimation)
        {
            switch (passage)
            {
                case 9:
                    if (inputEstimation.Min33.HasValue && inputEstimation.Max33.HasValue)
                    {
                        if (!estimations.Any(x => x.Min33 == inputEstimation.Min33))
                        {
                            return true;
                        }
                    }
                    break;
                case 10:
                    if (inputEstimation.Min38.HasValue && inputEstimation.Max38.HasValue)
                    {
                        if (!estimations.Any(x => x.Min38 == inputEstimation.Min38))
                        {
                            return true;
                        }
                    }
                    break;
                case 11:
                    if (inputEstimation.Min42.HasValue && inputEstimation.Min42.HasValue)
                    {
                        if (!estimations.Any(x => x.Min42 == inputEstimation.Min42))
                        {
                            return true;
                        }
                    }
                    break;
                case 12:
                    if (inputEstimation.Min46.HasValue && inputEstimation.Min46.HasValue)
                    {
                        if (!estimations.Any(x => x.Min46 == inputEstimation.Min46))
                        {
                            return true;
                        }
                    }
                    break;
                case 13:
                    if (inputEstimation.Min50.HasValue && inputEstimation.Min50.HasValue)
                    {
                        if (!estimations.Any(x => x.Min50 == inputEstimation.Min50))
                        {
                            return true;
                        }
                    }
                    break;
                case 14:
                    if (inputEstimation.Min54.HasValue && inputEstimation.Min54.HasValue)
                    {
                        if (!estimations.Any(x => x.Min54 == inputEstimation.Min54))
                        {
                            return true;
                        }
                    }
                    break;
                case 15:
                    if (inputEstimation.Min58.HasValue && inputEstimation.Min58.HasValue)
                    {
                        if (!estimations.Any(x => x.Min58 == inputEstimation.Min58))
                        {
                            return true;
                        }
                    }
                    break;
                case 16:
                    if (inputEstimation.Min63.HasValue && inputEstimation.Min63.HasValue)
                    {
                        if (!estimations.Any(x => x.Min63 == inputEstimation.Min63))
                        {
                            return true;
                        }
                    }
                    break;
                case 17:
                    if (inputEstimation.Min67.HasValue && inputEstimation.Min67.HasValue)
                    {
                        if (!estimations.Any(x => x.Min67 == inputEstimation.Min67))
                        {
                            return true;
                        }
                    }
                    break;
                case 18:
                    if (inputEstimation.Min71.HasValue && inputEstimation.Min71.HasValue)
                    {
                        if (!estimations.Any(x => x.Min71 == inputEstimation.Min71))
                        {
                            return true;
                        }
                    }
                    break;
                case 19:
                    if (inputEstimation.Min75.HasValue && inputEstimation.Min75.HasValue)
                    {
                        if (!estimations.Any(x => x.Min75 == inputEstimation.Min75))
                        {
                            return true;
                        }
                    }
                    break;
                case 20:
                    if (inputEstimation.Min79.HasValue && inputEstimation.Min79.HasValue)
                    {
                        if (!estimations.Any(x => x.Min79 == inputEstimation.Min79))
                        {
                            return true;
                        }
                    }
                    break;
                case 21:
                    if (inputEstimation.Min79.HasValue && inputEstimation.Min79.HasValue)
                    {
                        if (!estimations.Any(x => x.Min79 == inputEstimation.Min79))
                        {
                            return true;
                        }
                    }
                    break;
                case 22:
                    if (inputEstimation.Min83.HasValue && inputEstimation.Min83.HasValue)
                    {
                        if (!estimations.Any(x => x.Min83 == inputEstimation.Min83))
                        {
                            return true;
                        }
                    }
                    break;
                case 23:
                    if (inputEstimation.Min88.HasValue && inputEstimation.Min88.HasValue)
                    {
                        if (!estimations.Any(x => x.Min88 == inputEstimation.Min88))
                        {
                            return true;
                        }
                    }
                    break;
                case 24:
                    if (inputEstimation.Min92.HasValue && inputEstimation.Min92.HasValue)
                    {
                        if (!estimations.Any(x => x.Min92 == inputEstimation.Min92))
                        {
                            return true;
                        }
                    }
                    break;
            }
            return false;
        }

        private static ReleveEstimation GetReleveEstimationFromInput(AttaqueInputDto input)
        {
            var inputEstimation = new ReleveEstimation();
            if (!string.IsNullOrEmpty(input._33))
            {
                var isMin = double.TryParse(input._33.Split("-")[0], out var min);
                var isMax = double.TryParse(input._33.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min33 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max33 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._38))
            {
                var isMin = double.TryParse(input._38.Split("-")[0], out var min);
                var isMax = double.TryParse(input._38.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min38 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max38 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._42))
            {
                var isMin = double.TryParse(input._42.Split("-")[0], out var min);
                var isMax = double.TryParse(input._42.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min42 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max42 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._46))
            {
                var isMin = double.TryParse(input._46.Split("-")[0], out var min);
                var isMax = double.TryParse(input._46.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min46 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max46 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._50))
            {
                var isMin = double.TryParse(input._50.Split("-")[0], out var min);
                var isMax = double.TryParse(input._50.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min50 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max50 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._54))
            {
                var isMin = double.TryParse(input._54.Split("-")[0], out var min);
                var isMax = double.TryParse(input._54.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min54 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max54 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._58))
            {
                var isMin = double.TryParse(input._58.Split("-")[0], out var min);
                var isMax = double.TryParse(input._58.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min58 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max58 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._63))
            {
                var isMin = double.TryParse(input._63.Split("-")[0], out var min);
                var isMax = double.TryParse(input._63.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min63 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max63 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._67))
            {
                var isMin = double.TryParse(input._67.Split("-")[0], out var min);
                var isMax = double.TryParse(input._67.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min67 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max67 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._71))
            {
                var isMin = double.TryParse(input._71.Split("-")[0], out var min);
                var isMax = double.TryParse(input._71.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min71 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max71 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._75))
            {
                var isMin = double.TryParse(input._75.Split("-")[0], out var min);
                var isMax = double.TryParse(input._75.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min75 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max75 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._79))
            {
                var isMin = double.TryParse(input._79.Split("-")[0], out var min);
                var isMax = double.TryParse(input._79.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min79 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max79 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._83))
            {
                var isMin = double.TryParse(input._83.Split("-")[0], out var min);
                var isMax = double.TryParse(input._83.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min83 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max83 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._88))
            {
                var isMin = double.TryParse(input._88.Split("-")[0], out var min);
                var isMax = double.TryParse(input._88.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min88 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max88 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._92))
            {
                var isMin = double.TryParse(input._92.Split("-")[0], out var min);
                var isMax = double.TryParse(input._92.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min92 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max92 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._96))
            {
                var isMin = double.TryParse(input._96.Split("-")[0], out var min);
                var isMax = double.TryParse(input._96.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min96 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max96 = max;
                }
            }

            if (!string.IsNullOrEmpty(input._100))
            {
                var isMin = double.TryParse(input._100.Split("-")[0], out var min);
                var isMax = double.TryParse(input._100.Split("-")[1], out var max);
                if (isMin)
                {
                    inputEstimation.Min100 = min;
                }
                if (isMax)
                {
                    inputEstimation.Max100 = max;
                }
            }

            return inputEstimation;
        }
    }

    public class ReleveEstimation
    {
        public double OffsetMinPossible { get; set; }
        public double OffsetMaxPossible { get; set; }
        public double? Min33 { get; set; }
        public double? Max33 { get; set; }
        public double? Min38 { get; set; }
        public double? Max38 { get; set; }
        public double? Min42 { get; set; }
        public double? Max42 { get; set; }
        public double? Min46 { get; set; }
        public double? Max46 { get; set; }
        public double? Min50 { get; set; }
        public double? Max50 { get; set; }
        public double? Min54 { get; set; }
        public double? Max54 { get; set; }
        public double? Min58 { get; set; }
        public double? Max58 { get; set; }
        public double? Min63 { get; set; }
        public double? Max63 { get; set; }
        public double? Min67 { get; set; }
        public double? Max67 { get; set; }
        public double? Min71 { get; set; }
        public double? Max71 { get; set; }
        public double? Min75 { get; set; }
        public double? Max75 { get; set; }
        public double? Min79 { get; set; }
        public double? Max79 { get; set; }
        public double? Min83 { get; set; }
        public double? Max83 { get; set; }
        public double? Min88 { get; set; }
        public double? Max88 { get; set; }
        public double? Min92 { get; set; }
        public double? Max92 { get; set; }
        public double? Min96 { get; set; }
        public double? Max96 { get; set; }
        public double? Min100 { get; set; }
        public double? Max100 { get; set; }

        public bool CompareOnMin(ReleveEstimation inputEstimation)
        {
            var isMin33 = true; if (inputEstimation.Min33.HasValue) { isMin33 = inputEstimation.Min33 == this.Min33; }
            var isMin38 = true; if (inputEstimation.Min38.HasValue) { isMin38 = inputEstimation.Min38 == this.Min38; }
            var isMin42 = true; if (inputEstimation.Min42.HasValue) { isMin42 = inputEstimation.Min42 == this.Min42; }
            var isMin46 = true; if (inputEstimation.Min46.HasValue) { isMin46 = inputEstimation.Min46 == this.Min46; }
            var isMin50 = true; if (inputEstimation.Min50.HasValue) { isMin50 = inputEstimation.Min50 == this.Min50; }
            var isMin54 = true; if (inputEstimation.Min54.HasValue) { isMin54 = inputEstimation.Min54 == this.Min54; }
            var isMin58 = true; if (inputEstimation.Min58.HasValue) { isMin58 = inputEstimation.Min58 == this.Min58; }
            var isMin63 = true; if (inputEstimation.Min63.HasValue) { isMin63 = inputEstimation.Min63 == this.Min63; }
            var isMin67 = true; if (inputEstimation.Min67.HasValue) { isMin67 = inputEstimation.Min67 == this.Min67; }
            var isMin71 = true; if (inputEstimation.Min71.HasValue) { isMin71 = inputEstimation.Min71 == this.Min71; }
            var isMin75 = true; if (inputEstimation.Min75.HasValue) { isMin75 = inputEstimation.Min75 == this.Min75; }
            var isMin79 = true; if (inputEstimation.Min79.HasValue) { isMin79 = inputEstimation.Min79 == this.Min79; }
            var isMin83 = true; if (inputEstimation.Min83.HasValue) { isMin83 = inputEstimation.Min83 == this.Min83; }
            var isMin88 = true; if (inputEstimation.Min88.HasValue) { isMin88 = inputEstimation.Min88 == this.Min88; }
            var isMin92 = true; if (inputEstimation.Min92.HasValue) { isMin92 = inputEstimation.Min92 == this.Min92; }
            var isMin96 = true; if (inputEstimation.Min96.HasValue) { isMin96 = inputEstimation.Min96 == this.Min96; }
            var isMin100 = true; if (inputEstimation.Min100.HasValue) { isMin100 = inputEstimation.Min100 == this.Min100; }

            return isMin33 && isMin38 && isMin42 && isMin46 && isMin50 && isMin54 && isMin58 && isMin63 && isMin67 && isMin71 && isMin75 && isMin79 && isMin83 && isMin88 && isMin92 && isMin96 && isMin100;
        }
    }

    public class EstimationKey
    {
        public double Attaque { get; set; }
        public int OffSetMinInitial { get; set; }
        public int OffSetMaxInitial { get; set; }
    }

    public class AttaqueInputDto
    {
        public string _33 { get; set; }
        public string _38 { get; set; }
        public string _42 { get; set; }
        public string _46 { get; set; }
        public string _50 { get; set; }
        public string _54 { get; set; }
        public string _58 { get; set; }
        public string _63 { get; set; }
        public string _67 { get; set; }
        public string _71 { get; set; }
        public string _75 { get; set; }
        public string _79 { get; set; }
        public string _83 { get; set; }
        public string _88 { get; set; }
        public string _92 { get; set; }
        public string _96 { get; set; }
        public string _100 { get; set; }
    }
}
