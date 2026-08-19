using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Chest;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models.ExternalTools;
using MyHordesOptimizerApi.Models.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
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
        protected ExternalToolsUpdateJobRunner UpdateJobRunner { get; private set; }
        protected IMhoHeadersProvider MhoHeadersProvider { get; private set; }

        public ExternalToolsController(ILogger<ExternalToolsController> logger,
            IUserInfoProvider userKeyProvider,
            IExternalToolsService externalToolsService,
            ExternalToolsUpdateJobRunner externalToolsUpdateJobRunner,
            IMhoHeadersProvider mhoHeadersProvider) : base(logger, userKeyProvider)
        {
            ExternalToolsService = externalToolsService;
            UpdateJobRunner = externalToolsUpdateJobRunner;
            MhoHeadersProvider = mhoHeadersProvider;
        }

        /// <summary>Contrôles communs aux deux routes de mise à jour. Null si la requête est valide.</summary>
        private ActionResult ValidateUpdateRequest(string userKey, UpdateRequestDto updateRequestDto)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            if (updateRequestDto == null)
            {
                return BadRequest($"{nameof(updateRequestDto)} cannot be null");
            }
            if (updateRequestDto.TownDetails == null || updateRequestDto.TownDetails.TownId == 0)
            {
                return BadRequest($"{nameof(updateRequestDto.TownDetails)} cannot be empty");
            }
            if (UpdateRequestMapToolsToUpdateDetailsDto.IsCell(updateRequestDto.Map.ToolsToUpdate.IsBigBrothHordes))
            {
                return BadRequest($"IsBigBrothHordes ne peut pas avoir une valeur autre que \"api\" ou \"none\"");
            }
            return null;
        }

        [HttpPost]
        [Route("Update")]
        public async Task<ActionResult<UpdateResponseDto>> UpdateExternalsTools(string userKey, int userId, [FromBody] UpdateRequestDto updateRequestDto)
        {
            var invalid = ValidateUpdateRequest(userKey, updateRequestDto);
            if (invalid != null)
            {
                return invalid;
            }

            UserInfoProvider.UserKey = userKey;
            UserInfoProvider.UserId = userId;
            var response = await ExternalToolsService.UpdateExternalsTools(updateRequestDto);
            return Ok(response);
        }

        [HttpPost]
        [Route("Update/Start")]
        public ActionResult<ExternalToolsUpdateJobState> StartUpdateExternalsTools(string userKey, int userId, [FromBody] UpdateRequestDto updateRequestDto)
        {
            var invalid = ValidateUpdateRequest(userKey, updateRequestDto);
            if (invalid != null)
            {
                return invalid;
            }

            UserInfoProvider.UserKey = userKey;
            UserInfoProvider.UserId = userId;

            var state = UpdateJobRunner.TryStart(userId, userKey, UserInfoProvider.UserName, updateRequestDto,
                MhoHeadersProvider.MhoOrigin, MhoHeadersProvider.MhoAddonVersion, HttpContext.TraceIdentifier);
            if (state == null)
            {
                // Double clic ou second onglet : le client suit le lancement déjà en cours.
                return Conflict(UpdateJobRunner.GetState(userId));
            }
            return Accepted(state);
        }

        [HttpGet]
        [Route("Update/Status")]
        public ActionResult<ExternalToolsUpdateJobState> GetUpdateExternalsToolsStatus(string userKey, int userId)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            return Ok(UpdateJobRunner.GetState(userId));
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
        public ActionResult<LastUpdateInfoDto> UpdateCitizenBag([FromQuery] int townId, [FromQuery] int userId, [FromBody] UpdateSingleBagDto request)
        {
            UserInfoProvider.UserId = userId;
            var lastUpdateInfo = ExternalToolsService.UpdateCitizenBag(townId, request.UserId, request.Objects);
            return Ok(lastUpdateInfo);
        }

        [HttpPost]
        [Route("Chest")]
        public ActionResult<LastUpdateInfoDto> UpdateCitizenChest([FromQuery] int townId, [FromQuery] int userId, [FromBody] UpdateSingleChestDto request)
        {
            UserInfoProvider.UserId = userId;
            var lastUpdateInfo = ExternalToolsService.UpdateCitizenChest(townId, request.UserId, request.Objects);
            return Ok(lastUpdateInfo);
        }

        [HttpPost]
        [Route("Status")]
        public ActionResult<LastUpdateInfoDto> UpdateCitizenStatus([FromQuery] int townId, [FromQuery] int userId, [FromBody] UpdateSingleStatusDto request)
        {
            UserInfoProvider.UserId = userId;
            var lastUpdateInfo = ExternalToolsService.UpdateCitizenStatus(townId, request.UserId, request.Status);
            return Ok(lastUpdateInfo);
        }

        [HttpPost]
        [Route("HeroicActions")]
        public ActionResult<LastUpdateInfoDto> UpdateCitizenHeroicActions([FromQuery] int townId, [FromQuery] int userId, [FromBody] UpdateSingleHeroicActionsDto request)
        {
            UserInfoProvider.UserId = userId;
            var lastUpdateInfo = ExternalToolsService.UpdateCitizenHeroicActions(townId, request.UserId, request.HeroicActions);
            return Ok(lastUpdateInfo);
        }

        [HttpPost]
        [Route("Home")]
        public ActionResult<LastUpdateInfoDto> UpdateCitizenHome([FromQuery] int townId, [FromQuery] int userId, [FromBody] UpdateSingleHomeDto request)
        {
            UserInfoProvider.UserId = userId;
            var lastUpdateInfo = ExternalToolsService.UpdateCitizenHome(townId, request.UserId, request.Home);
            return Ok(lastUpdateInfo);
        }

        [HttpPost]
        [Route("Ghoul")]
        public ActionResult<LastUpdateInfoDto> UpdateGhoulStatus([FromQuery] int townId, [FromQuery] int userId, [FromBody] UpdateGhoulStatusDto request)
        {
            UserInfoProvider.UserId = userId;
            var lastUpdateInfo = ExternalToolsService.UpdateGhoulStatus(townId, userId, request);
            return Ok(lastUpdateInfo);
        }
    }
}
