using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Controllers
{
    [Controller]
    [Authorize]
    public class TownController : AbstractMyHordesOptimizerControllerBase
    {
        protected ITownService TownService { get; init; }
        public TownController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, 
            IUserInfoProvider userInfoProvider,
            ITownService townService) : base(logger, userInfoProvider)
        {
            TownService = townService;
        }

        [HttpGet]
        [Route("{townId}/user/{userId}")]
        public ActionResult<CitizenDto> GetTownCitizen([FromRoute] int townId, [FromRoute] int userId)
        {
            var citizen = TownService.GetTownCitizen(townId, userId);
            return Ok(citizen);
        }
    }
}
