using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.UserAvailability;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UserAvailabilityController : AbstractMyHordesOptimizerControllerBase
    {
        protected IUserAvailabilityService UserAvailabilityService { get; private set; }

        public UserAvailabilityController(ILogger<UserAvailabilityController> logger,
            IUserInfoProvider userKeyProvider,
            IUserAvailabilityService userAvailabilityService) : base(logger, userKeyProvider)
        {
            UserAvailabilityService = userAvailabilityService;
        }

        [HttpPost]
        [Route("Ghoul")]
        public ActionResult<LastUpdateInfo> UpdateGhoulStatus([FromQuery] int townId, [FromQuery] int userId, [FromBody] UpdateGhoulStatusDto request)
        {
            UserKeyProvider.UserId = userId;
            return Ok();
        }
    }
}
