using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
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
        public async Task<ActionResult<ExpeditionDto>> PostExpedition([FromRoute] int townId, [FromRoute] int day, [FromBody] ExpeditionDto expedition)
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
        [Route("{expeditionId}/parts")]
        public async Task<ActionResult<ExpeditionPartDto>> PostExpeditionPart([FromRoute] int expeditionId, [FromBody] ExpeditionPartDto expeditionPart)
        {
            if (expeditionPart.Id.HasValue)
            {
                // Update
            }
            else
            {
                // Create
            }
            //TODO
            return Ok(null);
        }

        [HttpDelete]
        [Route("parts/{expeditionPartId}")]
        public async Task<ActionResult> DeleteExpeditionPart([FromRoute] int expeditionPartId)
        {
            //TODO
            return Ok();
        }


        [HttpPost]
        [Route("parts/{expeditionPartId}/citizen")]
        public async Task<ActionResult<ExpeditionCitizenDto>> PostExpeditionCitizen([FromRoute] int expeditionPartId, [FromBody] ExpeditionCitizenDto expeditionCitizen)
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
        [Route("parts/{expeditionPartId}/order")]
        public async Task<ActionResult<ExpeditionOrderDto>> PostExpeditionOrder([FromRoute] int expeditionPartId, [FromBody] ExpeditionOrderDto expeditionOrder)
        {
            if (expeditionOrder.Id.HasValue)
            {
                // Update
            }
            else
            {
                // Create
            }
            //TODO
            return Ok(null);
        }

        [HttpDelete]
        [Route("parts/order/{expeditionOrderId}")]
        public async Task<ActionResult> DeleteExpeditionOrder([FromRoute] int expeditionOrderId)
        {
            //TODO
            return Ok();
        }
    }
}
