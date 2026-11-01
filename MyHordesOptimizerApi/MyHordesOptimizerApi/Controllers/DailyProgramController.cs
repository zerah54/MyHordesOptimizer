using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.DailyProgram;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class DailyProgramController : AbstractMyHordesOptimizerControllerBase
    {
        protected IDailyProgramService DailyProgramService { get; init; }

        public DailyProgramController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, IUserInfoProvider userInfoProvider, IDailyProgramService dailyProgramService) : base(logger, userInfoProvider)
        {
            DailyProgramService = dailyProgramService;
        }

        [HttpGet("{mapId}/{day}")]
        public async Task<ActionResult<DailyProgramFactsDto>> GetFacts([FromRoute] int mapId, [FromRoute] int day)
        {
            return Ok(await DailyProgramService.GetFactsAsync(mapId, day));
        }
    }
}
