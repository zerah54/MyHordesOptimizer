using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.PreTowns;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Controllers
{
    /// <summary>Pré-villes : préparation d'une ville avant son lancement.</summary>
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class PreTownsController : AbstractMyHordesOptimizerControllerBase
    {
        protected IPreTownService PreTownService { get; init; }
        protected IPreTownLinkService PreTownLinkService { get; init; }

        public PreTownsController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, IUserInfoProvider userInfoProvider, IPreTownService preTownService, IPreTownLinkService preTownLinkService) : base(logger, userInfoProvider)
        {
            PreTownService = preTownService;
            PreTownLinkService = preTownLinkService;
        }

        [HttpPost]
        public async Task<ActionResult<PreTownDto>> Create([FromBody] PreTownAliasRequestDto request)
        {
            return Ok(await PreTownService.CreateAsync(request.Alias));
        }

        [HttpPost("{id}/duplicate")]
        public async Task<ActionResult<PreTownDto>> Duplicate([FromRoute] int id, [FromBody] PreTownAliasRequestDto request)
        {
            return Ok(await PreTownService.DuplicateAsync(id, request.Alias));
        }

        [HttpGet("mine")]
        public async Task<ActionResult<List<PreTownSummaryDto>>> ListMine()
        {
            return Ok(await PreTownService.ListMineAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PreTownDto>> Get([FromRoute] int id)
        {
            return Ok(await PreTownService.GetAsync(id));
        }

        [HttpPut("{id}/members/{idUser}")]
        public async Task<IActionResult> AddMember([FromRoute] int id, [FromRoute] int idUser)
        {
            await PreTownService.AddMemberAsync(id, idUser);
            return NoContent();
        }

        [HttpDelete("{id}/members/{idUser}")]
        public async Task<IActionResult> RemoveMember([FromRoute] int id, [FromRoute] int idUser)
        {
            await PreTownService.RemoveMemberAsync(id, idUser);
            return NoContent();
        }

        [HttpPut("{id}/organizers/{idUser}")]
        public async Task<IActionResult> SetOrganizer([FromRoute] int id, [FromRoute] int idUser, [FromQuery] bool isOrganizer = true)
        {
            await PreTownService.SetOrganizerAsync(id, idUser, isOrganizer);
            return NoContent();
        }

        [HttpPut("{id}/alias")]
        public async Task<IActionResult> Rename([FromRoute] int id, [FromBody] PreTownAliasRequestDto request)
        {
            await PreTownService.RenameAsync(id, request.Alias);
            return NoContent();
        }

        [HttpPut("{id}/simulated-citizens")]
        public async Task<IActionResult> SetSimulatedCitizens([FromRoute] int id, [FromBody] PreTownSimulatedCitizensRequestDto request)
        {
            await PreTownService.SetSimulatedCitizensAsync(id, request.SimulatedCitizens);
            return Ok();
        }

        [HttpGet("{id}/link/preview")]
        public async Task<ActionResult<LinkPreviewDto>> PreviewLink([FromRoute] int id)
        {
            return Ok(await PreTownLinkService.PreviewAsync(id));
        }

        [HttpPost("{id}/link")]
        public async Task<ActionResult<LinkResultDto>> Link([FromRoute] int id)
        {
            return Ok(await PreTownLinkService.LinkAsync(id));
        }

        [HttpDelete("{id}/link")]
        public async Task<IActionResult> Unlink([FromRoute] int id)
        {
            await PreTownLinkService.UnlinkAsync(id);
            return NoContent();
        }

        [HttpPut("{id}/seen")]
        public async Task<IActionResult> MarkSeen([FromRoute] int id)
        {
            await PreTownService.MarkSeenAsync(id);
            return NoContent();
        }
    }
}
