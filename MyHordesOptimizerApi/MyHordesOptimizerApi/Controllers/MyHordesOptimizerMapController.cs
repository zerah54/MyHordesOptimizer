using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("Map")]
    public class MyHordesOptimizerMapController : AbstractMyHordesOptimizerControllerBase
    {
        protected IMyHordesOptimizerMapService _mapService { get; private set; }
        public MyHordesOptimizerMapController(ILogger<MyHordesOptimizerMapController> logger,
          IMyHordesOptimizerMapService mapService,
          IUserInfoProvider userKeyProvider) : base(logger, userKeyProvider)
        {
            _mapService = mapService;
        }

        [HttpPost]
        [Route("Cell")]
        public ActionResult<LastUpdateInfoDto> UpdateCell([FromQuery] int? townId, [FromQuery] int? userId, [FromBody] MyHordesOptimizerCellUpdateDto updateRequest)
        {
            if (!userId.HasValue)
            {
                return BadRequest($"{nameof(userId)} cannot be empty");
            }
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }
            UserInfoProvider.UserId = userId.Value;
            var lastUpdateInfo = _mapService.UpdateCell(townId.Value, updateRequest);
            return lastUpdateInfo;
        }
    }
}
