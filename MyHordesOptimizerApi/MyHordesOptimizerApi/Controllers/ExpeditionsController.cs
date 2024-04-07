using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class ExpeditionsController : AbstractMyHordesOptimizerControllerBase
    {
        protected IExpeditionService ExpeditionService { get; private set; }

        public ExpeditionsController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, IUserInfoProvider userInfoProvider, IExpeditionService expeditionService) : base(logger, userInfoProvider)
        {
            ExpeditionService = expeditionService;
        }

        [HttpPost]
        [Route("{townId}/{day}")]
        public async Task<ActionResult<ExpeditionDto>> PostExpedition([FromRoute] int townId, [FromRoute] int day, [FromBody] ExpeditionRequestDto expedition)
        {
            var savedExpedition = await ExpeditionService.SaveExpeditionAsync(expedition, townId, day);
            return Ok(savedExpedition);
        }

        [HttpGet]
        [Route("{townId}/{day}")]
        public async Task<ActionResult<List<ExpeditionDto>>> GetExpeditions([FromRoute] int townId, [FromRoute] int day)
        {
            var expedition = ExpeditionService.GetExpeditionsByDay(townId, day);
            return Ok(expedition);
        }

        [HttpDelete]
        [Route("{expeditionId}")]
        public ActionResult DeleteExpedition([FromRoute] int expeditionId)
        {
            ExpeditionService.DeleteExpedition(expeditionId);
            return Ok();
        }

        [HttpPost]
        [Route("{townId}/copy")]
        public async Task<ActionResult> CopyExpeditions([FromRoute] int townId, [FromQuery] int fromDay, [FromQuery] int targetDay)
        {
            if (fromDay < 1)
            {
                return BadRequest($"{nameof(fromDay)} should be > 0");
            }
            if (targetDay < 1)
            {
                return BadRequest($"{nameof(targetDay)} should be > 0");
            }
            if(fromDay == targetDay)
            {
                return BadRequest($"{nameof(fromDay)} should be different from {nameof(targetDay)}");
            }
            var newExpeditions = await ExpeditionService.CopyExpeditionsAsync(townId, fromDay, targetDay);
            return Ok(newExpeditions);
        }

        [HttpPost]
        [Route("{expeditionId}/parts")]
        public async Task<ActionResult<ExpeditionPartDto>> PostExpeditionPart([FromRoute] int expeditionId, [FromBody] ExpeditionPartRequestDto expeditionPart)
        {
            var expeditionPartResult = await ExpeditionService.SaveExpeditionPartAsync(expeditionId, expeditionPart);
            return Ok(expeditionPartResult);
        }

        [HttpDelete]
        [Route("parts/{expeditionPartId}")]
        public async Task<ActionResult> DeleteExpeditionPart([FromRoute] int expeditionPartId)
        {
            ExpeditionService.DeleteExpeditionPart(expeditionPartId);
            return Ok();
        }


        [HttpPost]
        [Route("parts/{expeditionPartId}/citizen")]
        public async Task<ActionResult<ExpeditionCitizenDto>> PostExpeditionCitizen([FromRoute] int expeditionPartId, [FromBody] ExpeditionCitizenRequestDto expeditionCitizen)
        {
            var returnedExpeditionCitizen = await ExpeditionService.SaveExpeditionCitizenAsync(expeditionPartId, expeditionCitizen);
            return Ok(returnedExpeditionCitizen);
        }

        [HttpDelete]
        [Route("parts/citizen/{expeditionCitizenId}")]
        public ActionResult DeleteExpeditionCitizen([FromRoute] int expeditionCitizenId)
        {
            ExpeditionService.DeleteExpeditionCitizen(expeditionCitizenId);
            return Ok();
        }

        [HttpPost]
        [Route("parts/{expeditionPartId}/orders")]
        public async Task<ActionResult<ExpeditionOrderDto>> PostPartOrders([FromRoute] int expeditionPartId, [FromBody] List<ExpeditionOrderDto> expeditionOrder)
        {
            var returnedOrder = await ExpeditionService.SavePartOrdersAsync(expeditionPartId, expeditionOrder);
            return Ok(returnedOrder);
        }

        [HttpPost]
        [Route("citizen/{expeditionCitizenId}/orders")]
        public async Task<ActionResult<ExpeditionOrderDto>> PostCitizenOrders([FromRoute] int expeditionCitizenId, [FromBody] List<ExpeditionOrderDto> expeditionOrder)
        {
            var returnedOrder = await ExpeditionService.SaveCitizenOrdersAsync(expeditionCitizenId, expeditionOrder);
            return Ok(returnedOrder);
        }

        [HttpDelete]
        [Route("orders/{expeditionOrderId}")]
        public async Task<ActionResult> DeleteExpeditionOrder([FromRoute] int expeditionOrderId)
        {
            ExpeditionService.DeleteExpeditionOrder(expeditionOrderId);
            return Ok();
        }

        [HttpPost]
        [Route("orders")]
        public ActionResult SaveExpeditionOrder([FromBody] ExpeditionOrderDto expeditionOrder)
        {
            if(!expeditionOrder.Id.HasValue)
            {
                return BadRequest($"{nameof(expeditionOrder.Id)} cannot be empty");
            }
            var updatedDto = ExpeditionService.UpdateExpeditionOrder(expeditionOrder);
            return Ok(updatedDto);
        }
    }
}
