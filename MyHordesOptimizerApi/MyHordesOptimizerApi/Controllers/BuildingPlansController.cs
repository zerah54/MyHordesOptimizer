using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Hubs;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl.BuildingPlans;
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
        /// <summary>Identifiant de la connexion SignalR de l'appelant, qui sert à vérifier le verrou et à l'exclure de la diffusion.</summary>
        public const string HubConnectionHeader = "Mho-Hub-Connection";

        protected IBuildingPlanService BuildingPlanService { get; init; }
        protected BuildingPlanLockRegistry LockRegistry { get; init; }
        protected IBuildingPlanBroadcaster Broadcaster { get; init; }
        protected ITownAccessService TownAccessService { get; init; }

        public BuildingPlansController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, IUserInfoProvider userInfoProvider, IBuildingPlanService buildingPlanService,
            BuildingPlanLockRegistry lockRegistry, IBuildingPlanBroadcaster broadcaster, ITownAccessService townAccessService) : base(logger, userInfoProvider)
        {
            BuildingPlanService = buildingPlanService;
            LockRegistry = lockRegistry;
            Broadcaster = broadcaster;
            TownAccessService = townAccessService;
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
        public async Task<ActionResult<BuildingPlanDto>> SavePlan([FromRoute] int mapId, [FromBody] BuildingPlanRequestDto request, [FromHeader(Name = HubConnectionHeader)] string? connectionId)
        {
            if (request.Id is int existingId)
            {
                await EnsureNotLockedByAnotherAsync(mapId, existingId, connectionId, requireHolder: true);
            }
            var result = await BadRequestOnInvalid(() => BuildingPlanService.SavePlanAsync(mapId, request));
            if (result.Result is not OkObjectResult { Value: BuildingPlanDto plan })
            {
                return result;
            }
            var key = new PlanLockKey(mapId, plan.Id);
            if (request.Id is null)
            {
                if (connectionId is not null && LockRegistry.TryAcquire(key, new PlanLockHolder(connectionId, UserInfoProvider.UserId)) is null)
                {
                    await Broadcaster.PlanSavedAsync(mapId, plan, connectionId);
                    await Broadcaster.PlanLockChangedAsync(mapId, new PlanLockDto { PlanId = plan.Id, HolderUserId = UserInfoProvider.UserId, HolderConnectionId = connectionId });
                    return result;
                }
            }
            else
            {
                LockRegistry.Touch(key, connectionId!);
            }
            await Broadcaster.PlanSavedAsync(mapId, plan, connectionId);
            return result;
        }

        [HttpDelete("{mapId}/plans/{planId:int}")]
        public async Task<IActionResult> DeletePlan([FromRoute] int mapId, [FromRoute] int planId, [FromHeader(Name = HubConnectionHeader)] string? connectionId)
        {
            await EnsureNotLockedByAnotherAsync(mapId, planId, connectionId, requireHolder: false);
            await BuildingPlanService.DeletePlanAsync(mapId, planId);
            if (connectionId is not null)
            {
                LockRegistry.Release(new PlanLockKey(mapId, planId), connectionId);
            }
            await Broadcaster.PlanDeletedAsync(mapId, planId, connectionId);
            return NoContent();
        }

        [HttpPut("{mapId}/plans/{planId:int}/effective")]
        public async Task<ActionResult<BuildingPlanDto>> SetEffective([FromRoute] int mapId, [FromRoute] int planId, [FromHeader(Name = HubConnectionHeader)] string? connectionId)
        {
            var result = await BadRequestOnInvalid(() => BuildingPlanService.SetEffectiveAsync(mapId, planId));
            if (result.Result is OkObjectResult { Value: BuildingPlanDto plan })
            {
                await Broadcaster.PlanEffectiveChangedAsync(mapId, plan, connectionId);
            }
            return result;
        }

        [HttpPut("{mapId}/settings")]
        public async Task<ActionResult<BuildingPlansDto>> SaveSettings([FromRoute] int mapId, [FromBody] BuildingPlanSettingsRequestDto request, [FromHeader(Name = HubConnectionHeader)] string? connectionId)
        {
            var result = await BadRequestOnInvalid(() => BuildingPlanService.SaveSettingsAsync(mapId, request));
            if (result.Result is OkObjectResult { Value: BuildingPlansDto plans })
            {
                await Broadcaster.SettingsSavedAsync(mapId, plans, connectionId);
            }
            return result;
        }

        /// <summary>
        /// Lève 423 si une autre connexion détient la proposition ; sans en-tête, refuse aussi quand <paramref name="requireHolder"/> impose d'être le détenteur.
        /// Dans ce cas, une main libre (jamais prise, ou expirée avant le balayage) est prise pour l'appelant et diffusée.
        /// </summary>
        private async Task EnsureNotLockedByAnotherAsync(int mapId, int planId, string? connectionId, bool requireHolder)
        {
            var key = new PlanLockKey(mapId, planId);
            var holder = LockRegistry.HolderOf(key);
            if (requireHolder && holder is null && connectionId is not null)
            {
                // Droit d'écriture vérifié avant : un non-citoyen ne doit pas bloquer la proposition.
                await TownAccessService.EnsureCanWriteMapAsync(mapId);
                holder = LockRegistry.TryAcquire(key, new PlanLockHolder(connectionId, UserInfoProvider.UserId));
                if (holder is null)
                {
                    await Broadcaster.PlanLockChangedAsync(mapId, new PlanLockDto { PlanId = planId, HolderUserId = UserInfoProvider.UserId, HolderConnectionId = connectionId });
                    return;
                }
            }
            if (requireHolder ? holder?.ConnectionId != connectionId || connectionId is null : holder is not null && holder.ConnectionId != connectionId)
            {
                Logger.LogInformation("BuildingPlanLock {Event} map {MapId} plan {PlanId} user {UserId} holder {HolderUserId}",
                    "Refused", mapId, planId, UserInfoProvider.UserId, holder?.UserId);
                throw new MhoLockedException("La proposition est verrouillée par une autre connexion");
            }
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
