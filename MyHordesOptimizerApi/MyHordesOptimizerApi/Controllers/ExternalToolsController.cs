using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;

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
        public ActionResult<UpdateResponseDto> UpdateExternalsTools(string userKey, string userId, [FromBody] UpdateRequestDto updateRequestDto)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            if (updateRequestDto == null)
            {
                return BadRequest($"{nameof(updateRequestDto)} cannot be null");
            }
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest($"{nameof(userId)} cannot be empty");
            }
            UserKeyProvider.UserKey = userKey;
            UserKeyProvider.UserId = userId;
            var response = ExternalToolsService.UpdateExternalsTools(updateRequestDto);
            return Ok(response);
        }

        [HttpPost]
        [Route("UpdateGHZoneRegen")]
        public ActionResult<List<CaseGH>> UpdateGHZoneRegen([FromBody] UpdateZoneRegenDto requestDto)
        {
            if (requestDto == null)
            {
                return BadRequest($"{nameof(requestDto)} cannot be null");
            }
            requestDto.DynamicsCells = new List<dynamic>();
            foreach (var cell in requestDto.Cells)
            {
                requestDto.DynamicsCells.Add(JObject.Parse(cell.ToString()));
            }
            var cases = ExternalToolsService.UpdateGHZoneRegen(requestDto);
            Logger.LogTrace($"[ExternalToolsController][UpdateGHZoneRegen] {requestDto.ToJson()} {Environment.NewLine} {cases.ToJson()}");
            return cases;
        }
    }
}
