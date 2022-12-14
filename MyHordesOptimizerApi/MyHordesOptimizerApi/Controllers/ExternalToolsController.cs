using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

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
        public async Task<ActionResult<UpdateResponseDto>> UpdateExternalsTools(string userKey, int userId, [FromBody] UpdateRequestDto updateRequestDto)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            if (updateRequestDto == null)
            {
                return BadRequest($"{nameof(updateRequestDto)} cannot be null");
            }
            if (updateRequestDto.TownDetails==null || updateRequestDto.TownDetails.TownId == 0)
            {
                return BadRequest($"{nameof(updateRequestDto.TownDetails)} cannot be empty");
            }
            var bbh = updateRequestDto.Map.ToolsToUpdate.IsBigBrothHordes;
            var fata = updateRequestDto.Map.ToolsToUpdate.IsFataMorgana;
            if (UpdateRequestMapToolsToUpdateDetailsDto.IsCell(bbh))
            {
                return BadRequest($"IsBigBrothHordes ne peut pas avoir une valeur autre que \"api\" ou \"none\"");
            }
            if (UpdateRequestMapToolsToUpdateDetailsDto.IsCell(fata))
            {
                return BadRequest($"IsFataMorgana ne peut pas avoir une valeur autre que \"api\" ou \"none\"");
            }

            UserKeyProvider.UserKey = userKey;
            UserKeyProvider.UserId = userId;
            var response = await ExternalToolsService.UpdateExternalsTools(updateRequestDto);
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

        [HttpPost]
        [Route("Bag")]
        public ActionResult<LastUpdateInfo> UpdateCitizenBag([FromQuery] int townId, [FromQuery] int userId, [FromBody] List<UpdateObjectDto> bag)
        {
            UserKeyProvider.UserId = userId;
            var lastUpdateInfo = ExternalToolsService.UpdateCitizenBag(townId, userId, bag);
            return Ok(lastUpdateInfo);
        }

        [HttpPost]
        [Route("Status")]
        public ActionResult<LastUpdateInfo> UpdateCitizenStatus([FromQuery] int townId, [FromQuery] int userId, [FromBody] List<string> status)
        {
            UserKeyProvider.UserId = userId;
            var lastUpdateInfo = ExternalToolsService.UpdateCitizenStatus(townId, userId, status);
            return Ok(lastUpdateInfo);
        }

        [HttpPost]
        [Route("HeroicActions")]
        public ActionResult<LastUpdateInfo> UpdateCitizenHeroicActions([FromQuery] int townId, [FromQuery] int userId, [FromBody] CitizenActionsHeroicValue actionHeroics)
        {
            UserKeyProvider.UserId = userId;
            var lastUpdateInfo = ExternalToolsService.UpdateCitizenHeroicActions(townId, userId, actionHeroics);
            return Ok(lastUpdateInfo);
        }

        [HttpPost]
        [Route("Home")]
        public ActionResult<LastUpdateInfo> UpdateCitizenHome([FromQuery] int townId, [FromQuery] int userId, [FromBody] CitizenHomeValue homeDetails)
        {
            UserKeyProvider.UserId = userId;
            var lastUpdateInfo = ExternalToolsService.UpdateCitizenHome(townId, userId, homeDetails);
            return Ok(lastUpdateInfo);
        }
    }
}
