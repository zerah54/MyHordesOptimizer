using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Controllers
{
    /// <summary>Plans de chantiers d'une ville : propositions par jour et réglages de valeur des objets.</summary>
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class BuildingPlansController : AbstractMyHordesOptimizerControllerBase
    {
        protected IBuildingPlanService BuildingPlanService { get; init; }

        public BuildingPlansController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, IUserInfoProvider userInfoProvider, IBuildingPlanService buildingPlanService) : base(logger, userInfoProvider)
        {
            BuildingPlanService = buildingPlanService;
        }

        [HttpGet("{mapId}")]
        public async Task<ActionResult<BuildingPlansDto>> GetPlans([FromRoute] int mapId)
        {
            return Ok(await BuildingPlanService.GetPlansAsync(mapId));
        }

        /// <summary>État synchronisé des chantiers de la ville (construit ou non, PA restants, ressources) et sa défense.</summary>
        [HttpGet("{mapId}/state")]
        public async Task<ActionResult<BuildingPlanStateDto>> GetState([FromRoute] int mapId)
        {
            return Ok(await BuildingPlanService.GetStateAsync(mapId));
        }

        [HttpPut("{mapId}/plans")]
        public Task<ActionResult<BuildingPlanDto>> SavePlan([FromRoute] int mapId, [FromBody] BuildingPlanRequestDto request)
        {
            return BadRequestOnInvalid(() => BuildingPlanService.SavePlanAsync(mapId, request));
        }

        [HttpDelete("{mapId}/plans/{planId:int}")]
        public async Task<IActionResult> DeletePlan([FromRoute] int mapId, [FromRoute] int planId)
        {
            await BuildingPlanService.DeletePlanAsync(mapId, planId);
            return NoContent();
        }

        [HttpPut("{mapId}/plans/{planId:int}/effective")]
        public Task<ActionResult<BuildingPlanDto>> SetEffective([FromRoute] int mapId, [FromRoute] int planId)
        {
            return BadRequestOnInvalid(() => BuildingPlanService.SetEffectiveAsync(mapId, planId));
        }

        [HttpPut("{mapId}/settings")]
        public Task<ActionResult<BuildingPlansDto>> SaveSettings([FromRoute] int mapId, [FromBody] BuildingPlanSettingsRequestDto request)
        {
            return BadRequestOnInvalid(() => BuildingPlanService.SaveSettingsAsync(mapId, request));
        }

        /// <summary>400 avec le message pour une requête invalide ; ApiExceptionFilter ne traduit pas <see cref="MhoTechnicalException"/> (500).</summary>
        private async Task<ActionResult<T>> BadRequestOnInvalid<T>(Func<Task<T>> action)
        {
            try
            {
                return Ok(await action());
            }
            catch (MhoTechnicalException exception)
            {
                return BadRequest(exception.Message);
            }
        }
    }
}
