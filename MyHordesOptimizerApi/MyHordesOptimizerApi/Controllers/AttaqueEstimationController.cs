using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AttaqueEstimationController : AbstractMyHordesOptimizerControllerBase
    {
        protected IMyHordesOptimizerEstimationService EstimationService { get; private set; }

        public AttaqueEstimationController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userKeyProvider,
            IMyHordesOptimizerEstimationService estimationService) : base(logger, userKeyProvider)
        {
            EstimationService = estimationService;
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

            UserInfoProvider.UserId = userId.Value;

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
            return Ok(estimations);
        }

        [HttpGet]
        [Route("apofooAttackCalculation")]
        public ActionResult<string> ApofooTodayAttackCalculation([FromQuery] int day, [FromQuery] int townId)
        {
            return Ok(EstimationService.ApofooCalculateAttack(townId, day));
        }

        [HttpGet]
        [Route("apofooAttackCalculation/beta")]
        public ActionResult<string> ApofooTodayAttackCalculationBeta([FromQuery] int day, [FromQuery] int townId)
        {
            return Ok(EstimationService.ApofooCalculateAttack(townId, day, true));
        }
    }
}
