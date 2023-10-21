using System;
using System.Collections.Generic;
using System.Linq;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AttaqueEstimationController : AbstractMyHordesOptimizerControllerBase
    {
        protected IMyHordesOptimizerEstimationService EstimationService { get; private set; }
        protected IMapper Mapper { get; private set; }

        private double safetyRatioOffset = 3;
        private double shift = 10;

        public AttaqueEstimationController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userKeyProvider,
            IMyHordesOptimizerEstimationService estimationService,
            IMapper mapper) : base(logger, userKeyProvider)
        {
            EstimationService = estimationService;
            Mapper = mapper;
        }

        [HttpPost]
        [Route("Estimations")]
        public ActionResult PostEstimations([FromBody] EstimationRequestDto request, [FromQuery] int? townId,
            [FromQuery] int? userId)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }

            if (request == null)
            {
                return BadRequest($"{nameof(request)} cannot be null");
            }

            if (request.Day == null)
            {
                return BadRequest($"{nameof(request.Day)} cannot be null");
            }

            if (!userId.HasValue)
            {
                return BadRequest($"{nameof(userId)} cannot be empty");
            }

            UserKeyProvider.UserId = userId.Value;

            EstimationService.UpdateEstimations(townId.Value, request);
            return Ok();
        }

        [HttpGet]
        [Route("Estimations/{day}")]
        public ActionResult<EstimationRequestDto> GetEstimations([FromRoute] int? day, [FromQuery] int? townId)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }

            if (!day.HasValue)
            {
                return BadRequest($"{nameof(day)} cannot be empty");
            }

            var estimations = EstimationService.GetEstimations(townId.Value, day.Value);
            return Ok(estimations.ToJson());
        }

        [HttpGet]
        [Route("apofooAttackCalculation")]
        public ActionResult<string> ApofooTodayAttackCalculation([FromQuery] int day, [FromQuery] int townId)
        {
            return Ok(ApofooCalculateAttack(townId, day));
        }

        [HttpGet]
        [Route("apofooAttackCalculation/beta")]
        public ActionResult<string> ApofooTodayAttackCalculationBeta([FromQuery] int day, [FromQuery] int townId)
        {
            return Ok(ApofooCalculateAttack(townId, day, true));
        }


        private EstimationValueDto ApofooCalculateAttack(int townId, int dayAttack, bool beta = false)
        {
            var estim = EstimationService.GetEstimations(townId, dayAttack).Estim;
            var planif = EstimationService.GetEstimations(townId, dayAttack - 1).Planif;

            var lastPlanif = GetLast(planif);
            var lastEstim = GetLast(estim);
            
            var redSouls = 0;

            var maxRatio = 1; // doit être déterminé en fonction du type de ville (3 en pandé, 0.66 en RNE)
            var ratioMin = dayAttack <= 3 ? 0.66 : maxRatio;
            var ratioMax = dayAttack <= 3 ? (dayAttack <= 1 ? 0.4 : 0.66) : maxRatio;

            var attaqueMin = Math.Round(ratioMin * Math.Pow(Math.Max(1, dayAttack - 1) * 0.75 + 2.5, 3),
                MidpointRounding.AwayFromZero);
            var attaqueMax = Math.Round(ratioMax * Math.Pow(dayAttack * 0.75 + 3.5, 3), MidpointRounding.AwayFromZero);

            var planif0 = planif._0;
            var planif100 = planif._100;

            var estim100 = estim._100;

            var resultsMin = new List<double>();
            var resultsMax = new List<double>();
            var result = new EstimationValueDto();

            /* Le planif 0% doit exister pour pouvoir pouvoir affiner le résultat de l'attaque */
            if (planif0 != null)
            {
                var lastMinDiffFrom100Planif = GetLastMinDiffFrom100(planif);
                var lastMaxDiffFrom100Planif = GetLastMaxDiffFrom100(planif);
                var lastMinDiffFrom100Estim = GetLastMinDiffFrom100(estim);
                var lastMaxDiffFrom100Estim = GetLastMaxDiffFrom100(estim);
                var lastMaxBehind50Planif = GetLastMaxBehind50(planif);
                var lastMaxBehind50Estim = GetLastMaxBehind50(estim);
                var lastDiffFrom100Planif = GetLastDiffFrom100(planif);

                var startOffsetMin = 5;
                var endOffsetMin = 26;

                /*
                 * Si le planif 100 existe, et que la borne max du planif ne bouge pas, on peut réduire l'offset min à 25 ou 26
                 * Sinon, si le planif 100 existe, on peut réduire à 24, 25 et 26
                 */
                if (planif100 != null && planif0.Max == planif100.Max)
                {
                    startOffsetMin = 25;
                }
                else if (planif100 != null)
                {
                    endOffsetMin = 24;
                }

                for (var currentOffsetMin = startOffsetMin; currentOffsetMin <= endOffsetMin; currentOffsetMin++)
                {
                    var currentOffsetMax = 28 - currentOffsetMin;

                    var startTargetMin = CalculateTarget("min", planif0.Min, currentOffsetMin);
                    var endTargetMin = Math.Ceiling((planif0.Min + 24) / (1.0 - currentOffsetMin / 100.0));

                    var startTargetMax = CalculateTarget("max", planif0.Max, currentOffsetMax);
                    var endTargetMax = Math.Floor((planif0.Max - 24) / (1.0 + currentOffsetMax / 100.0));

                    /**
                     * Si l'estim 100 existe, le planif 100 existe, et le planif stagne
                     * Note : Si le planif stagne, alors l'estim stagne
                     */
                    if (currentOffsetMax <= 3 && planif100 != null && planif100.Max == planif0.Max && estim100 != null)
                    {
                        var tempTargetMax = CalculateTarget("max", estim100.Max, currentOffsetMax);
                        var estimFirstValue = GetFirstNonEmptyValue(estim);
                        if (estimFirstValue != null
                            && CalculateBorne("max", tempTargetMax, currentOffsetMax) == estimFirstValue.Max)
                        {
                            startTargetMax = tempTargetMax;
                            endTargetMax = tempTargetMax;
                        }
                        else
                        {
                            continue;
                        }
                    }

                    for (var targetMin = startTargetMin; targetMin <= endTargetMin; targetMin++)
                    {
                        for (var targetMax = startTargetMax; targetMax >= endTargetMax; targetMax--)
                        {
                            var calculatePlanifMin =
                                RoundTo25("min", CalculateBorne("min", targetMin, currentOffsetMin));
                            var calculatePlanifMax =
                                RoundTo25("max", CalculateBorne("max", targetMax, currentOffsetMax));

                            var calculateAttack = (targetMax - targetMin) * shift;
                            var calculateAttackMin = calculateAttack - 10;
                            var calculateAttackMax = calculateAttack + 10;

                            /**
                             * La liste des filtres à passer
                             * Si tous ces filtres sont à true, ça veut dire que la valeur calculée est une valeur possible pour l'attaque

                             */
                            if (calculatePlanifMin == planif0.Min
                                && calculatePlanifMax == planif0.Max
                                && IsValidAttack(targetMin, targetMax, calculateAttackMin, calculateAttackMax)
                                && IsValidOffsetMinPlanifFinal(planif100, targetMin, lastMinDiffFrom100Planif)
                                && IsValidOffsetMaxPlanifFinal(planif100, targetMax, lastMaxDiffFrom100Planif)
                                && IsValidOffsetMinEstimFinal(estim100, targetMin, lastMinDiffFrom100Estim)
                                && IsValidOffsetMaxEstimFinal(estim100, targetMax, lastMaxDiffFrom100Estim)
                                && IsValidStagnationFinalePlanifOffsetMin(planif100, lastMaxBehind50Planif,
                                    targetMin)
                                && IsValidStagnationFinalePlanifOffsetMax(planif100, lastMaxBehind50Planif,
                                    targetMax)
                                && IsValidStagnationFinaleEstimOffsetMin(estim100, lastMaxBehind50Estim, targetMin)
                                && IsValidStagnationFinaleEstimOffsetMax(estim100, lastMaxBehind50Estim, targetMax)
                                && IsValidSommeOffsets100AndPrevious(planif100, lastDiffFrom100Planif, targetMin,
                                    targetMax)
                                && IsValidAlter(estim, targetMin, targetMax, beta)
                               )
                            {
                                calculateAttackMin = Math.Max(calculateAttackMin, targetMin);
                                calculateAttackMax = Math.Min(calculateAttackMax, targetMax);

                                resultsMin.Add(calculateAttackMin);
                                resultsMax.Add(calculateAttackMax);
                            }
                        }
                    }
                }
                
                /**
                 * Si le tableau des résultats possibles a bien été alimenté, alors on peut déterminer un min et un max de l'attaque
                 * On choisi la valeur parmi toutes les valeurs possibles ainsi que la valeur théorique
                 */
                if (resultsMin.Count > 0 && resultsMax.Count > 0)
                {
                    
                    result.Min = Convert.ToInt32(Math.Max(resultsMin.Min(), attaqueMin));
                    result.Max = Convert.ToInt32(Math.Min(resultsMax.Max(), attaqueMax));
                    if (lastEstim != null)
                    {
                        result.Min = Math.Max(result.Min, lastEstim.Min);
                        result.Max = Math.Min(result.Max, lastEstim.Max);
                    }
                    if (lastPlanif != null)
                    {
                        result.Min = Math.Max(result.Min, lastPlanif.Min);
                        result.Max = Math.Min(result.Max, lastPlanif.Max);
                    }
                    return result;
                }
            }

            /* Si le planif 0% n'existe pas, ou que la fonction ne renvoie pas de résultat, alors on renvoie le min et le max théorique du jour */
            result.Min = Convert.ToInt32(attaqueMin);
            result.Max = Convert.ToInt32(attaqueMax);
            if (lastEstim != null)
            {
                result.Min = Math.Max(result.Min, lastEstim.Min);
                result.Max = Math.Min(result.Max, lastEstim.Max);
            }
            if (lastPlanif != null)
            {
                result.Min = Math.Max(result.Min, lastPlanif.Min);
                result.Max = Math.Min(result.Max, lastPlanif.Max);
            }
            return result;
        }

        /* true si l'attaque calculée à cet instant est bien cohérente avec le targetMin et le targetMax */
        private bool IsValidAttack(double targetMin, double targetMax, double calculateAttackMin,
            double calculateAttackMax)
        {
            if (calculateAttackMin >= targetMax) return false;
            if (calculateAttackMax <= targetMin) return false;
            return true;
        }

        /*
         * on skip ce test si si le planif100 n'existe pas, ou si la borne minimum du planif100 stagne
         * true si deux offsets min de planifs différents consécutifs sont supérieurs à 3
         */
        private bool IsValidOffsetMinPlanifFinal(EstimationValueDto planif100, double targetMin,
            EstimationValueDto lastMinDiffFrom100Planif)
        {
            if (planif100 == null || lastMinDiffFrom100Planif == null ||
                planif100.Min == lastMinDiffFrom100Planif.Min) return true;

            var offsetMinPrevious = CalculateOffset("min", targetMin, lastMinDiffFrom100Planif.Min);
            var offsetMin100 = CalculateOffset("min", targetMin, planif100.Min);

            return !(offsetMin100 < safetyRatioOffset && offsetMinPrevious < safetyRatioOffset);
        }

        /*
         * on skip ce test si si le planif100 n'existe pas, ou si la borne maximum du planif100 stagne
         * true si deux offsets max de planifs différents consécutifs sont supérieurs à 3
         */
        private bool IsValidOffsetMaxPlanifFinal(EstimationValueDto planif100, double targetMax,
            EstimationValueDto lastMaxDiffFrom100Planif)
        {
            if (planif100 == null || lastMaxDiffFrom100Planif == null ||
                planif100.Max == lastMaxDiffFrom100Planif.Max) return true;

            var offsetMaxPrevious = CalculateOffset("max", targetMax, lastMaxDiffFrom100Planif.Max);
            var offsetMax100 = CalculateOffset("max", targetMax, planif100.Max);

            return !(offsetMax100 < safetyRatioOffset && offsetMaxPrevious < safetyRatioOffset);
        }
        
        /*
         * on skip ce test si si le estim100 n'existe pas, ou si la borne minimum de l'estim100 stagne
         * true si deux offsets min d'estims consécutifs sont supérieurs à 3
         */
        private bool IsValidOffsetMinEstimFinal(EstimationValueDto estim100, double targetMin,
            EstimationValueDto lastMinDiffFrom100Estim)
        {
            if (estim100 == null || lastMinDiffFrom100Estim == null ||
                estim100.Min == lastMinDiffFrom100Estim.Min) return true;

            var offsetMinPrevious = CalculateOffset("min", targetMin, lastMinDiffFrom100Estim.Min);
            var offsetMin100 = CalculateOffset("min", targetMin, estim100.Min);

            return !(offsetMin100 < safetyRatioOffset && offsetMinPrevious < safetyRatioOffset);
        }
        
        /*
         * on skip ce test si si le estim100 n'existe pas, ou si la borne maximum de l'estim100 stagne
         * true si deux offsets max d'estims consécutifs sont supérieurs à 3
         */
        private bool IsValidOffsetMaxEstimFinal(EstimationValueDto estim100, double targetMax,
            EstimationValueDto lastMaxDiffFrom100Estim)
        {
            if (estim100 == null || lastMaxDiffFrom100Estim == null ||
                estim100.Max == lastMaxDiffFrom100Estim.Max) return true;

            var offsetMaxPrevious = CalculateOffset("max", targetMax, lastMaxDiffFrom100Estim.Max);
            var offsetMax100 = CalculateOffset("max", targetMax, estim100.Max);

            return !(offsetMax100 < safetyRatioOffset && offsetMaxPrevious < safetyRatioOffset);
        }
        
        /*
         * on skip ce test si il n'y a aucune valeur en dessous de 50%, si il n'y a pas le planif 100, ou si la borne min ne stagne pas
         * 
         */
        private bool IsValidStagnationFinalePlanifOffsetMin(EstimationValueDto planif100,
            EstimationValueDto lastMaxBehind50, double targetMin)
        {
            if (lastMaxBehind50 == null || planif100 == null || lastMaxBehind50.Min != planif100.Min) return true;

            var planif100EcartMaxOffsetMin = CalculateOffset("min", targetMin, planif100.Min + 24);

            return planif100EcartMaxOffsetMin < safetyRatioOffset;
        }
        
        /*
         * on skip ce test si il n'y a aucune valeur en dessous de 50%, si il n'y a pas le planif 100, ou si la borne max ne stagne pas
         * 
         */
        private bool IsValidStagnationFinalePlanifOffsetMax(EstimationValueDto planif100,
            EstimationValueDto lastMaxBehind50, double targetMax)
        {
            if (lastMaxBehind50 == null || planif100 == null || lastMaxBehind50.Max != planif100.Max) return true;

            var planif100EcartMaxOffsetMax = CalculateOffset("max", targetMax, planif100.Max - 24);

            return planif100EcartMaxOffsetMax < safetyRatioOffset;
        }

        /*
         * on skip ce test si il n'y a aucune valeur en dessous de 50%, si il n'y a pas l'estim 100, ou si la borne min ne stagne pas
         *
         */
        private bool IsValidStagnationFinaleEstimOffsetMin(EstimationValueDto estim100,
            EstimationValueDto lastMaxBehind50, double targetMin)
        {
            if (lastMaxBehind50 == null || estim100 == null || lastMaxBehind50.Min != estim100.Min) return true;
            var offsetMin100 = CalculateOffset("min", targetMin, estim100.Min);

            return offsetMin100 < safetyRatioOffset;
        }

        /*
         * on skip ce test si il n'y a aucune valeur en dessous de 50%, si il n'y a pas l'estim 100, ou si la borne max ne stagne pas
         *
         */
        private bool IsValidStagnationFinaleEstimOffsetMax(EstimationValueDto estim100,
            EstimationValueDto lastMaxBehind50, double targetMax)
        {
            if (lastMaxBehind50 == null || estim100 == null || lastMaxBehind50.Max != estim100.Max) return true;
            var offsetMax100 = CalculateOffset("max", targetMax, estim100.Max);

            return offsetMax100 < safetyRatioOffset;
        }

        /*
         * on skip ce test si il n'y a pas de planif 100, ou pas de valeur de planif différente du planif 100
         * true si deux somme d'offsets de planifs consécutifs sont inférieures au shift
         */
        private bool IsValidSommeOffsets100AndPrevious(EstimationValueDto planif100,
            EstimationValueDto lastDiffFrom100Planif, double targetMin, double targetMax)
        {
            if (planif100 == null || lastDiffFrom100Planif == null || planif100.Min == 0 || planif100.Max == 0 ||
                lastDiffFrom100Planif.Min == 0 || lastDiffFrom100Planif.Max == 0) return true;

            var offsetMinPrevious = CalculateOffset("min", targetMin, lastDiffFrom100Planif.Min);
            var offsetMaxPrevious = CalculateOffset("max", targetMax, lastDiffFrom100Planif.Max);

            var offsetMin100 = CalculateOffset("min", targetMin, planif100.Min);
            var offsetMax100 = CalculateOffset("max", targetMax, planif100.Max);

            var sommeOffsets100 = offsetMin100 + offsetMax100;
            var sommeOffsetsPrevious = offsetMinPrevious + offsetMaxPrevious;

            return !(sommeOffsets100 < shift && sommeOffsetsPrevious < shift);
        }

        /*
         * on skip ce test si on n'est pas en beta
         */
        private bool IsValidAlter(EstimationsDto estim, double targetMin, double targetMax, bool beta)
        {
            if (beta == false) return true;
            
            var values = new List<EstimationTuple>();
            foreach (var tuple in estim.GetType().GetProperties())
            {
                var estimationTuple = CreateTupleFromValue(tuple.Name, tuple.GetValue(estim) as EstimationValueDto);
                if (estimationTuple.Percent >= 33)
                {
                    // ne marche que pour la TDG et il n'y a pas d'estim < 33 sur la TDG
                    values.Add(estimationTuple);
                }
            }

            values.Sort((value1, value2) => value2.Percent.CompareTo(value1.Percent));

            var percentBinoms = new List<List<string>>();
            for (var valueIndex = 0; valueIndex < values.Count - 1; valueIndex++)
            {
                var percentBinom = new List<string>();

                percentBinom.Add(values[valueIndex].Key);
                percentBinom.Add(values[valueIndex + 1].Key);

                percentBinoms.Add(percentBinom);
            }

            var i = 23;
            foreach (var percentBinom in percentBinoms)
            {
                i--;

                var firstEstim = typeof(EstimationsDto).GetProperty(percentBinom.Last()).GetValue(estim) as
                    EstimationValueDto;
                var lastEstim = typeof(EstimationsDto).GetProperty(percentBinom.First()).GetValue(estim) as
                    EstimationValueDto;

                if (firstEstim == null || firstEstim.Min == null || firstEstim.Max == null) continue;
                if (lastEstim == null || lastEstim.Min == null || lastEstim.Max == null) continue;


                // Pour le calcul d'ecart
                var offsetMinHighMin = CalculateOffset("min", targetMin, firstEstim.Min + 1); // Min 100% le plus loin
                var offsetMinHighMax = CalculateOffset("min", targetMin, firstEstim.Min - 1); // Min 100% le plus pres

                var offsetMaxHighMin = CalculateOffset("max", targetMax, firstEstim.Max - 1); // Max 100% le plus loin
                var offsetMaxHighMax = CalculateOffset("max", targetMax, firstEstim.Max + 1); // Max 100% le plus pres

                var spendableMin = (Math.Max(0, offsetMinHighMin - 3) + Math.Max(0, offsetMaxHighMin - 3)) /
                                   (24 - (i + 1));
                var spendableMax = (Math.Max(0, offsetMinHighMax - 3) + Math.Max(0, offsetMaxHighMax - 3)) /
                                   (24 - (i + 1));

                var alterMin = Math.Floor(spendableMin * 250) / 1000.0;
                var alterMax = Math.Floor(spendableMax * 1000) / 1000.0;


                if (firstEstim.Min != lastEstim.Min)
                {
                    var ecartMin = CalculateOffset("min", targetMin, firstEstim.Min + 1) -
                                   CalculateOffset("min", targetMin, lastEstim.Min - 1);
                    var ecartMax = CalculateOffset("min", targetMin, firstEstim.Min - 1) -
                                   CalculateOffset("min", targetMin, lastEstim.Min + 1);

                    if (!IsInBetween(ecartMin, alterMin, alterMax) && !IsInBetween(ecartMax, alterMin, alterMax))
                    {
                        return false;
                    }
                }

                if (firstEstim.Max != lastEstim.Max)
                {
                    var ecartMin = CalculateOffset("max", targetMax, firstEstim.Max - 1) -
                                   CalculateOffset("max", targetMax, lastEstim.Max + 1);
                    var ecartMax = CalculateOffset("max", targetMax, firstEstim.Max + 1) -
                                   CalculateOffset("max", targetMax, lastEstim.Max - 1);

                    if (!IsInBetween(ecartMin, alterMin, alterMax) && !IsInBetween(ecartMax, alterMin, alterMax))
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        private EstimationValueDto GetLastMinDiffFrom100(EstimationsDto estim)
        {
            var values = new List<EstimationTuple>();
            foreach (var tuple in estim.GetType().GetProperties())
            {
                var estimationTuple = CreateTupleFromValue(tuple.Name, tuple.GetValue(estim) as EstimationValueDto);
                if (estimationTuple != null
                    && estimationTuple.Min != null && estimationTuple.Min > 0
                    && estimationTuple.Max != null && estimationTuple.Max > 0
                    && estim._100 != null && estimationTuple.Key != "_100" && estimationTuple.Min != estim._100.Min)
                {
                    values.Add(estimationTuple);
                }
            }

            var orderedValues = values.OrderBy(tuple => tuple.Percent).ToList();
            if (orderedValues.Count > 0)
            {
                return typeof(EstimationsDto).GetProperty(orderedValues.Last().Key).GetValue(estim) as
                    EstimationValueDto;
            }

            return null;
        }

        private EstimationValueDto GetFirstNonEmptyValue(EstimationsDto estim)
        {
            var values = estim.GetType().GetProperties();
            var nonEmptyValues = new List<EstimationValueDto>();
            if (values != null && values.Length > 0)
            {
                nonEmptyValues = values
                    .Where((value) => value.GetValue(estim) as EstimationValueDto != null)
                    .Select((value) => value.GetValue(estim) as EstimationValueDto)
                    .ToList();
                return nonEmptyValues.First();
            }

            return null;
        }

        private EstimationValueDto GetLastMaxDiffFrom100(EstimationsDto estim)
        {
            var values = new List<EstimationTuple>();
            foreach (var tuple in estim.GetType().GetProperties())
            {
                var estimationTuple = CreateTupleFromValue(tuple.Name, tuple.GetValue(estim) as EstimationValueDto);
                if (estimationTuple != null
                    && estimationTuple.Min != null && estimationTuple.Min > 0
                    && estimationTuple.Max != null && estimationTuple.Max > 0
                    && estim._100 != null && estimationTuple.Key != "_100" && estimationTuple.Max != estim._100.Max)
                {
                    values.Add(estimationTuple);
                }
            }

            var orderedValues = values.OrderBy(tuple => tuple.Percent).ToList();
            if (orderedValues.Count > 0)
            {
                return typeof(EstimationsDto).GetProperty(orderedValues.Last().Key).GetValue(estim) as
                    EstimationValueDto;
            }

            return null;
        }

        private EstimationValueDto GetLastMaxBehind50(EstimationsDto estim)
        {
            var values = new List<EstimationTuple>();
            foreach (var tuple in estim.GetType().GetProperties())
            {
                var estimationTuple = CreateTupleFromValue(tuple.Name, tuple.GetValue(estim) as EstimationValueDto);
                if (estimationTuple != null
                    && estimationTuple.Min != null && estimationTuple.Min > 0
                    && estimationTuple.Max != null && estimationTuple.Max > 0
                    && estimationTuple.Key != "_0" && estimationTuple.Percent <= 50)
                {
                    values.Add(estimationTuple);
                }
            }

            var orderedValues = values.OrderBy(tuple => tuple.Percent).ToList();
            if (orderedValues.Count > 0)
            {
                return typeof(EstimationsDto).GetProperty(orderedValues.Last().Key).GetValue(estim) as
                    EstimationValueDto;
            }

            return null;
        }

        private EstimationValueDto GetLastDiffFrom100(EstimationsDto estim)
        {
            var values = new List<EstimationTuple>();
            foreach (var tuple in estim.GetType().GetProperties())
            {
                var estimationTuple = CreateTupleFromValue(tuple.Name, tuple.GetValue(estim) as EstimationValueDto);
                if (estimationTuple != null
                    && estimationTuple.Min != null && estimationTuple.Min > 0
                    && estimationTuple.Max != null && estimationTuple.Max > 0
                    && estim._100 != null
                    && estimationTuple.Key != "_100"
                    && (estimationTuple.Min != estim._100.Min || estimationTuple.Max != estim._100.Max)
                   )
                {
                    values.Add(estimationTuple);
                }
            }

            var orderedValues = values.OrderBy(tuple => tuple.Percent).ToList();
            if (orderedValues.Count > 0)
            {
                return typeof(EstimationsDto).GetProperty(orderedValues.Last().Key).GetValue(estim) as
                    EstimationValueDto;
            }

            return null;
        }

        private EstimationValueDto GetLast(EstimationsDto estim)
        {
            var values = new List<EstimationTuple>();
            foreach (var tuple in estim.GetType().GetProperties())
            {
                var estimationTuple = CreateTupleFromValue(tuple.Name, tuple.GetValue(estim) as EstimationValueDto);
                if (estimationTuple != null
                    && estimationTuple.Min != null && estimationTuple.Min > 0
                    && estimationTuple.Max != null && estimationTuple.Max > 0
                   )
                {
                    values.Add(estimationTuple);
                }
            }

            var orderedValues = values.OrderBy(tuple => tuple.Percent).ToList();
            if (orderedValues.Count > 0)
            {
                return typeof(EstimationsDto).GetProperty(orderedValues.Last().Key).GetValue(estim) as
                    EstimationValueDto;
            }

            return null;
        }

        private double CalculateOffset(string type, double target, double borne)
        {
            if (type == "min")
            {
                return 100 * (target - borne) / target;
            }

            return 100 * (borne - target) / target;
        }

        private double CalculateBorne(string type, double target, double offset)
        {
            if (type == "min")
            {
                return Math.Round(target - (target * offset / 100), MidpointRounding.AwayFromZero);
            }

            return Math.Round(target + (target * offset / 100), MidpointRounding.AwayFromZero);
        }

        private double CalculateTarget(string type, double borne, double offset)
        {
            if (type == "min")
            {
                return Math.Round(borne / (1 - offset / 100), MidpointRounding.AwayFromZero);
            }

            return Math.Round(borne / (1 + offset / 100), MidpointRounding.AwayFromZero);
        }

        private double RoundTo25(string type, double borne)
        {
            if (type == "min")
            {
                return Math.Floor(borne / 25) * 25;
            }

            return Math.Ceiling(borne / 25) * 25;
        }

        /** true si la valeur est strictement comprise entre la borne 1 et la borne 2 */
        private bool IsInBetween(double value, double borne1, double borne2)
        {
            if (borne1 > borne2)
            {
                return (value < borne1 && value > borne2);
            }

            if (borne2 > borne1)
            {
                return value < borne2 && value > borne1;
            }

            return false;
        }


        private EstimationTuple CreateTupleFromValue(string key, EstimationValueDto value)
        {
            if (value != null)
            {
                return new EstimationTuple(percent: int.Parse(key.Replace("_", "")), key: key, min: value.Min,
                    max: value.Max);
            }

            return new EstimationTuple(percent: int.Parse(key.Replace("_", "")), key: key, min: null,
                max: null);
        }
    }

    internal class EstimationTuple
    {
        public int Percent { get; set; }
        public string Key { get; set; }
        public double? Min { get; set; }
        public double? Max { get; set; }

        public EstimationTuple(int percent, string key, double? min, double? max)
        {
            Percent = percent;
            Key = key;
            Min = min;
            Max = max;
        }
    }
}