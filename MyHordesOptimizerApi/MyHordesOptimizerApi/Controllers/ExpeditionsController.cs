using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class ExpeditionsController : AbstractMyHordesOptimizerControllerBase
    {
        protected IExpeditionService ExpeditionService { get; init; }

        public ExpeditionsController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, IUserInfoProvider userInfoProvider, IExpeditionService expeditionService) : base(logger, userInfoProvider)
        {
            ExpeditionService = expeditionService;
        }

        [HttpGet]
        [Route("{townId}/{day}")]
        public ActionResult<List<ExpeditionDto>> GetExpeditions([FromRoute] int townId, [FromRoute] int day)
        {
            var expedition = ExpeditionService.GetExpeditionsByDay(townId, day);
            return Ok(expedition);
        }

        [HttpGet]
        [Route("me/{day}")]
        public ActionResult<List<ExpeditionDto>> GetMyExpeditions([FromRoute] int townId, [FromRoute] int day)
        {
            var expedition = ExpeditionService.GetUserExpeditionsByDay(UserInfoProvider.TownDetail.TownId, UserInfoProvider.UserId, day);
            return Ok(expedition);
        }
    }
}
