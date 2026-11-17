using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl.BuildingPlans;
using MyHordesOptimizerApi.Services.Impl.Locks;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Hubs
{
    /// <summary>État d'un verrou de proposition ; sans détenteur, le verrou est libre.</summary>
    public sealed class PlanLockDto
    {
        public int PlanId { get; set; }
        public int? HolderUserId { get; set; }
        public string? HolderConnectionId { get; set; }
    }

    /// <summary>
    /// Hub de la page Chantiers : présence et verrou de modification par proposition. La ville est celle du jeton, sauf après <see cref="UseTown"/> (pré-ville) ;
    /// le groupe SignalR est <c>mapId.ToString()</c>.
    /// </summary>
    [Authorize]
    public class BuildingPlansHub : Hub
    {
        protected BuildingPlanLockRegistry LockRegistry { get; init; }
        protected ITownAccessService TownAccessService { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected ILogger<AbstractMyHordesOptimizerControllerBase> Logger { get; init; }

        private static readonly ConcurrentDictionary<int, ConcurrentDictionary<string, int>> _connectedUsersByTownByConnexionId = new();

        public BuildingPlansHub(BuildingPlanLockRegistry lockRegistry,
            ITownAccessService townAccessService,
            IUserInfoProvider userInfoProvider,
            ILogger<AbstractMyHordesOptimizerControllerBase> logger)
        {
            LockRegistry = lockRegistry;
            TownAccessService = townAccessService;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var townId = TokenTownId();
            if (townId > 0)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, townId.ToString());
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connectionId = Context.ConnectionId;
            var tokenTownId = TokenTownId();
            var activeTownId = ActiveTownId();
            foreach (var key in LockRegistry.ReleaseAll(connectionId))
            {
                await SendLockChangedAsync(key.MapId, new PlanLockDto { PlanId = key.PlanId });
            }
            foreach (var townId in new[] { tokenTownId, activeTownId }.Where(id => id > 0).Distinct())
            {
                await Groups.RemoveFromGroupAsync(connectionId, townId.ToString());
                await LeavePresenceAsync(connectionId, UserInfoProvider.UserId, townId);
            }
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Cible une pré-ville (pseudo-mapId, membre requis, liée ou non) pour les appels suivants de la connexion ; quitte
        /// le groupe, la présence et les verrous de la précédente (y compris la ville du jeton). Appelée avec la ville du jeton, elle restaure le défaut ; toute autre
        /// ville réelle est refusée.
        /// </summary>
        public async Task UseTown(int mapId)
        {
            if (PreTownIds.IsPreTownMapId(mapId))
            {
                if (!await TownAccessService.CanReadPreTownAsync(mapId))
                {
                    throw new MhoForbiddenException($"L'utilisateur {UserInfoProvider.UserId} n'est pas membre de la pré-ville {mapId - PreTownIds.Offset}.");
                }
            }
            else if (mapId != TokenTownId())
            {
                throw new MhoForbiddenException("Seule la ville du jeton ou une pré-ville peut être ciblée");
            }
            var previous = ActiveTownId();
            if (previous > 0 && previous != mapId)
            {
                // La connexion ne reçoit plus rien de la ville quittée (même celle du jeton) et n'y garde ni présence ni verrou.
                await LeavePresenceAsync(Context.ConnectionId, UserInfoProvider.UserId, previous);
                foreach (var key in LockRegistry.ReleaseAll(Context.ConnectionId, k => k.MapId == previous))
                {
                    await SendLockChangedAsync(key.MapId, new PlanLockDto { PlanId = key.PlanId });
                }
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, previous.ToString());
            }
            if (mapId == TokenTownId())
            {
                Context.Items.Remove(ActiveMapIdKey);
            }
            else
            {
                Context.Items[ActiveMapIdKey] = mapId;
            }
            if (mapId > 0)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, mapId.ToString());
            }
        }

        /// <summary>Déclare la connexion présente sur la page ; renvoie la liste des présents de la ville active. Sans ville, ne fait rien.</summary>
        public async Task<List<int>> JoinPresence()
        {
            var townId = ActiveTownId();
            if (townId <= 0)
            {
                return new List<int>();
            }
            var usersIdByConnexionId = _connectedUsersByTownByConnexionId.GetOrAdd(townId, _ => new ConcurrentDictionary<string, int>());
            usersIdByConnexionId[Context.ConnectionId] = UserInfoProvider.UserId;
            var connectedUsers = usersIdByConnexionId.Values.Distinct().ToList();
            await Clients.Group(townId.ToString()).SendAsync(BuildingPlansHubEvent.UserJoined.GetDescription(), connectedUsers.ToJson());
            return connectedUsers;
        }

        /// <summary>Retire la présence de la connexion (page fermée) ; elle reste dans le groupe de sa ville.</summary>
        public async Task LeavePresence()
        {
            await LeavePresenceAsync(Context.ConnectionId, UserInfoProvider.UserId, ActiveTownId());
        }

        /// <summary>Prend le verrou s'il est libre ; sinon renvoie le détenteur actuel, sans rien diffuser.</summary>
        public async Task<PlanLockDto> AcquirePlanLock(int planId)
        {
            var townId = RequireTownId();
            await TownAccessService.EnsureCanWriteMapAsync(townId);
            var userId = UserInfoProvider.UserId;
            var holder = LockRegistry.TryAcquire(new PlanLockKey(townId, planId), new LockHolder(Context.ConnectionId, userId));
            if (holder is not null)
            {
                Logger.LogInformation("BuildingPlanLock {Event} map {MapId} plan {PlanId} user {UserId} holder {HolderUserId}",
                    "Refused", townId, planId, userId, holder.UserId);
                return new PlanLockDto { PlanId = planId, HolderUserId = holder.UserId, HolderConnectionId = holder.ConnectionId };
            }
            return await GrantAsync(townId, planId, userId);
        }

        /// <summary>Renvoie les verrous actifs de la ville active, sans rien diffuser.</summary>
        public async Task<List<PlanLockDto>> GetPlanLocks()
        {
            var townId = RequireTownId();
            await TownAccessService.EnsureCanWriteMapAsync(townId);
            return LockRegistry.ActiveHoldersOf(townId)
                .Select(l => new PlanLockDto { PlanId = l.Key.PlanId, HolderUserId = l.Holder.UserId, HolderConnectionId = l.Holder.ConnectionId })
                .ToList();
        }

        /// <summary>Reprend le verrou à son détenteur actuel, qui est averti par la diffusion.</summary>
        public async Task<PlanLockDto> TakePlanLock(int planId)
        {
            var townId = RequireTownId();
            await TownAccessService.EnsureCanWriteMapAsync(townId);
            var userId = UserInfoProvider.UserId;
            var previous = LockRegistry.TakeOver(new PlanLockKey(townId, planId), new LockHolder(Context.ConnectionId, userId));
            if (previous is not null)
            {
                Logger.LogInformation("BuildingPlanLock {Event} map {MapId} plan {PlanId} user {UserId} holder {HolderUserId}",
                    "TakenOver", townId, planId, userId, previous.UserId);
            }
            return await GrantAsync(townId, planId, userId);
        }

        public async Task ReleasePlanLock(int planId)
        {
            var townId = RequireTownId();
            if (LockRegistry.Release(new PlanLockKey(townId, planId), Context.ConnectionId))
            {
                await SendLockChangedAsync(townId, new PlanLockDto { PlanId = planId });
            }
        }

        /// <summary>Signale aux autres clients de la ville que les tâches cochées de l'utilisateur ont changé.</summary>
        public async Task NotifyTaskChecks(int userId)
        {
            await Clients.OthersInGroup(ActiveTownId().ToString()).SendAsync(BuildingPlansHubEvent.TaskChecksChanged.GetDescription(), userId);
        }

        // Diffusé à chaque octroi : un verrou périmé non balayé a pu changer de main sans que ExpireIdle le signale.
        private async Task<PlanLockDto> GrantAsync(int townId, int planId, int userId)
        {
            var dto = new PlanLockDto { PlanId = planId, HolderUserId = userId, HolderConnectionId = Context.ConnectionId };
            await SendLockChangedAsync(townId, dto);
            return dto;
        }

        private Task SendLockChangedAsync(int townId, PlanLockDto dto)
        {
            return Clients.Group(townId.ToString()).SendAsync(BuildingPlansHubEvent.PlanLockChanged.GetDescription(), dto);
        }

        private async Task LeavePresenceAsync(string connectionId, int userId, int townId)
        {
            if (!_connectedUsersByTownByConnexionId.TryGetValue(townId, out var usersIdByConnexionId)
                || !usersIdByConnexionId.TryRemove(connectionId, out _))
            {
                return;
            }
            var connectedUsers = usersIdByConnexionId.Values.Distinct().ToList();
            if (!connectedUsers.Contains(userId))
            {
                await Clients.Group(townId.ToString()).SendAsync(BuildingPlansHubEvent.UserLeft.GetDescription(), connectedUsers.ToJson());
            }
            if (usersIdByConnexionId.IsEmpty)
            {
                _connectedUsersByTownByConnexionId.TryRemove(townId, out _);
            }
        }

        /// <summary>Ville active ; refuse l'appel si la connexion n'en a pas.</summary>
        private int RequireTownId()
        {
            var townId = ActiveTownId();
            if (townId <= 0)
            {
                throw new MhoForbiddenException("Aucune ville dans le jeton");
            }
            return townId;
        }

        private const string ActiveMapIdKey = "activeMapId";

        private int TokenTownId()
        {
            return UserInfoProvider.TownDetail?.TownId ?? 0;
        }

        /// <summary>Pré-ville ciblée par <see cref="UseTown"/>, sinon ville du jeton.</summary>
        private int ActiveTownId()
        {
            return Context.Items.TryGetValue(ActiveMapIdKey, out var active) && active is int mapId ? mapId : TokenTownId();
        }
    }

    public enum BuildingPlansHubEvent
    {
        [Description("UserJoined")]
        UserJoined,
        [Description("UserLeft")]
        UserLeft,
        [Description("PlanSaved")]
        PlanSaved,
        [Description("PlanDeleted")]
        PlanDeleted,
        [Description("PlanEffectiveChanged")]
        PlanEffectiveChanged,
        [Description("SettingsSaved")]
        SettingsSaved,
        [Description("PlanLockChanged")]
        PlanLockChanged,
        [Description("TaskChecksChanged")]
        TaskChecksChanged
    }
}
