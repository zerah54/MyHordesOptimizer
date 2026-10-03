using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Estimations;
using MyHordesOptimizerApi.Services.Impl.Estimations.Refinement;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AttaqueEstimationController : AbstractMyHordesOptimizerControllerBase
    {
        protected IMyHordesOptimizerEstimationService EstimationService { get; private set; }
        protected IRefinementService RefinementService { get; private set; }

        public AttaqueEstimationController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userKeyProvider,
            IMyHordesOptimizerEstimationService estimationService,
            IRefinementService refinementService) : base(logger, userKeyProvider)
        {
            EstimationService = estimationService;
            RefinementService = refinementService;
        }

        [HttpGet]
        [Route("Refinement/{day}/input")]
        [Authorize]
        [AliveCitizen]
        public ActionResult<RefinementInput> GetRefinementInput([FromRoute] int day, [FromQuery] int? townId)
        {
            var input = RefinementService.GetInput(townId!.Value, day);
            return input is null ? BadRequest("Aucune estimation saisie pour ce jour d'attaque") : Ok(input);
        }

        [HttpPost]
        [Route("Refinement/{day}")]
        [Authorize]
        [AliveCitizen]
        [EnableRateLimiting(RefinementRateLimitExtensions.PolicyName)]
        // Le corps porte des seeds : jamais journalisé, quel que soit le niveau de HttpLogging configuré.
        [HttpLogging(HttpLoggingFields.RequestPropertiesAndHeaders | HttpLoggingFields.RequestQuery | HttpLoggingFields.ResponsePropertiesAndHeaders)]
        public ActionResult<RefinementViewDto> PostRefinement([FromRoute] int day, [FromQuery] int? townId, [FromBody] RefinementUploadDto upload)
        {
            var seeds = RefinementEngine.DecodeSeeds(upload?.Candidates);
            if (upload?.Input is null || !upload.Input.IsWellFormed() || seeds is null)
            {
                return BadRequest($"input complet et candidates (base64 d'au plus {RefinementEngine.MaxCandidates} uint32) attendus");
            }
            try
            {
                return Ok(RefinementService.Upload(townId!.Value, day, upload.Input, seeds));
            }
            catch (RefinementConflictException)
            {
                return Conflict("Saisies modifiées pendant le scan, relancez l'affinage");
            }
        }

        [HttpGet]
        [Route("Refinement/{day}")]
        public ActionResult<RefinementViewDto> GetRefinement([FromRoute] int day, [FromQuery] int? townId)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }
            return Ok(RefinementService.Get(townId.Value, day));
        }

        [HttpPost]
        [Route("Estimations")]
        [Authorize]
        [AliveCitizen]
        public ActionResult PostEstimations([FromBody] EstimationRequestDto request, [FromQuery] int? townId)
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

            if (!SoulsAreValid(request.EstimSouls, request.EstimSpaLevel, EstimationPercents.Tdg)
                || !SoulsAreValid(request.PlanifSouls, request.PlanifSpaLevel, EstimationPercents.Planif))
            {
                return BadRequest("âmes : paliers de la famille, 0 à 1000 âmes ; niveau SPA : 0 à 3");
            }

            EstimationService.UpdateEstimations(townId.Value, request);
            return Ok();
        }

        [HttpGet]
        [Route("AttackSettings/{day}")]
        public ActionResult<AttackSettingsDto> GetAttackSettings([FromRoute] int day, [FromQuery] int? townId)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }
            return Ok(EstimationService.GetAttackSettingsWithDefaults(townId.Value, day));
        }

        [HttpPut]
        [Route("AttackSettings/{day}")]
        [Authorize]
        [AliveCitizen]
        public ActionResult PutAttackSettings([FromRoute] int day, [FromQuery] int? townId, [FromBody] AttackSettingsDto settings)
        {
            if (settings is null || settings.Souls is < 0 or > SoulsScenario.MaxSouls || settings.SpaLevel is < 0 or > SoulsScenario.MaxSpaLevel)
            {
                return BadRequest("souls : 0 à 1000 ; spaLevel : 0 à 3");
            }
            EstimationService.UpdateAttackSettings(townId!.Value, day, settings);
            return Ok();
        }

        /// <summary>Âmes d'une famille : paliers de cette famille, 0 à 1000 âmes ; niveau SPA 0 à 3 (null = non fourni).</summary>
        private static bool SoulsAreValid(Dictionary<int, int>? souls, int? spaLevel, int[] percents) =>
            (spaLevel is null || (spaLevel >= 0 && spaLevel <= SoulsScenario.MaxSpaLevel))
            && (souls is null || souls.All(entry => percents.Contains(entry.Key) && entry.Value >= 0 && entry.Value <= SoulsScenario.MaxSouls));

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
            return Ok(estimations);
        }

        [HttpGet]
        [Route("attackCalculation")]
        public ActionResult<string> TodayAttackCalculation([FromQuery] int day, [FromQuery] int townId, [FromQuery] AttackDifficulty difficulty = AttackDifficulty.Normal)
        {
            return Ok(EstimationService.CalculateAttack(townId, day, difficulty: difficulty));
        }

        [HttpGet]
        [Route("attackCalculation/beta")]
        public ActionResult<string> TodayAttackCalculationBeta([FromQuery] int day, [FromQuery] int townId, [FromQuery] AttackDifficulty difficulty = AttackDifficulty.Normal)
        {
            return Ok(EstimationService.CalculateAttack(townId, day, true, difficulty));
        }
    }
}
