using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ExternalToolsController : AbstractMyHordesOptimizerControllerBase
    {
        protected IExternalToolsService ExternalToolsService { get; private set; }

        public ExternalToolsController(ILogger<ExternalToolsController> logger,
            IUserInfoProvider userKeyProvider,
            IExternalToolsService externalToolsService) : base(logger, userKeyProvider)
        {
            ExternalToolsService = externalToolsService;
        }

        [HttpPost]
        [Route("Update")]
        public ActionResult<UpdateResponseDto> UpdateExternalsTools(string userKey, int userId, [FromBody] UpdateRequestDto updateRequestDto)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            if (updateRequestDto == null)
            {
                return BadRequest($"{nameof(updateRequestDto)} cannot be null");
            }
            UserKeyProvider.UserKey = userKey;
            UserKeyProvider.UserId = userId;
            var response = ExternalToolsService.UpdateExternalsTools(updateRequestDto);
            return Ok(response);
        }
    }
}
