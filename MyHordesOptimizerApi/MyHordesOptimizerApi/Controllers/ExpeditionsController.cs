using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Hubs;
using MyHordesOptimizerApi.Models.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Expeditions;
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
        protected IExpeditionService ExpeditionService { get; init; }
        protected ExpeditionLockRegistry LockRegistry { get; init; }
        protected IExpeditionLockScopeService LockScope { get; init; }
        protected IHubContext<ExpeditionsHub> HubContext { get; init; }

        public ExpeditionsController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, IUserInfoProvider userInfoProvider, IExpeditionService expeditionService,
            ExpeditionLockRegistry lockRegistry, IExpeditionLockScopeService lockScope, IHubContext<ExpeditionsHub> hubContext) : base(logger, userInfoProvider)
        {
            ExpeditionService = expeditionService;
            LockRegistry = lockRegistry;
            LockScope = lockScope;
            HubContext = hubContext;
        }

        /// <summary>Coche ou décoche une consigne hors hub (script) ; refusé (423) si un bloc qui la contient est verrouillé sur le site.</summary>
        [HttpPut]
        [Route("orders/{orderId}/done")]
        public async Task<ActionResult<ExpeditionOrderDto>> SetOrderDone([FromRoute] int orderId, [FromBody] bool isDone)
        {
            var townId = UserInfoProvider.TownDetail?.TownId ?? 0;
            foreach (var lockRef in await LockScope.OwnersOfOrderAsync(orderId))
            {
                var holder = LockRegistry.HolderOf(new ExpeditionLockKey(townId, lockRef.Kind, lockRef.EntityId));
                if (holder is not null)
                {
                    throw new MhoLockedException(holder.UserId);
                }
            }
            var updated = ExpeditionService.UpdateExpeditionOrder(new ExpeditionOrderDto { Id = orderId, IsDone = isDone });
            await HubContext.Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionOrderUpdated.GetDescription(), updated);
            return Ok(updated);
        }

        [HttpGet]
        [Route("{townId}/{day}")]
        public async Task<ActionResult<List<ExpeditionDto>>> GetExpeditions([FromRoute] int townId, [FromRoute] int day)
        {
            var expedition = await ExpeditionService.GetExpeditionsByDayAsync(townId, day);
            return Ok(expedition);
        }

        [HttpGet]
        [Route("me/{day}")]
        public ActionResult<List<ExpeditionDto>> GetMyExpeditions([FromRoute] int townId, [FromRoute] int day)
        {
            var expedition = ExpeditionService.GetUserExpeditionsByDay(UserInfoProvider.TownDetail!.TownId, UserInfoProvider.UserId, day);
            return Ok(expedition);
        }

        [HttpGet]
        [Route("{townId}/{day}/validate")]
        public ActionResult<ExpeditionInhorenceModel> ValidateExpeditions([FromRoute] int townId, [FromRoute] int day)
        {
            var incoherence = ExpeditionService.ValidateExpeditions(townId, day);
            return Ok(incoherence);
        }
    }
}
