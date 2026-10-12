using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Hubs
{
    [Authorize]
    public class ExpeditionsHub : Hub
    {
        protected IExpeditionService ExpeditionService { get; init; }
        protected IMapRouteService MapRouteService { get; init; }
        protected ITownAccessService TownAccessService { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected ILogger<AbstractMyHordesOptimizerControllerBase> Logger { get; init; }

        // Ville (mapId) suivie par chaque connexion : celle du jeton à la connexion, puis celle choisie par JoinTown.
        // SignalR n'exécute qu'une invocation à la fois par connexion : pas de course entre JoinTown et la déconnexion.
        private static ConcurrentDictionary<string, int> _townIdBySocketToken = new();
        private static ConcurrentDictionary<int, ConcurrentDictionary<string, int>> _connectedUsersByTownByConnexionId = new();

        public ExpeditionsHub(IExpeditionService expeditionService,
            IMapRouteService mapRouteService,
            ITownAccessService townAccessService,
            IUserInfoProvider userInfoProvider,
            ILogger<AbstractMyHordesOptimizerControllerBase> logger)
        {
            ExpeditionService = expeditionService;
            MapRouteService = mapRouteService;
            TownAccessService = townAccessService;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var connectionId = Context.ConnectionId;
            var userId = UserInfoProvider.UserId;
            // Jeton sans ville (claim absent) : aucun groupe, le client pourra appeler JoinTown.
            var townId = UserInfoProvider.TownDetail?.TownId ?? 0;
            Logger.LogDebug("[{@connectionId}] User {@userId} from town {@townId} joined hub", connectionId, userId, townId);
            if (townId > 0)
            {
                await JoinTownGroupAsync(connectionId, townId);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connectionId = Context.ConnectionId;
            if (_townIdBySocketToken.TryGetValue(connectionId, out var townId))
            {
                Logger.LogDebug("[{@connectionId}] {@userId} Disconnected", connectionId, UserInfoProvider.UserId);
                await LeaveTownGroupAsync(connectionId, UserInfoProvider.UserId, townId);
            }
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Bascule la connexion sur une autre ville dont l'utilisateur est citoyen, vivant ou mort (carte d'une
        /// ancienne ville) : les événements de cette ville lui parviennent, ceux de l'ancienne plus. La présence,
        /// si la connexion en a une, suit.
        /// </summary>
        public async Task JoinTown(int mapId)
        {
            var connectionId = Context.ConnectionId;
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("[{@connectionId}] {@userId} JoinTown {@mapId}", connectionId, userId, mapId);
            await TownAccessService.EnsureCanWriteMapAsync(mapId);
            var wasPresent = false;
            if (_townIdBySocketToken.TryGetValue(connectionId, out var previousTownId))
            {
                if (previousTownId == mapId)
                {
                    return;
                }
                wasPresent = IsPresent(connectionId, previousTownId);
                await LeaveTownGroupAsync(connectionId, userId, previousTownId);
            }
            await JoinTownGroupAsync(connectionId, mapId);
            if (wasPresent)
            {
                await JoinPresenceAsync(connectionId, userId, mapId);
            }
        }

        /// <summary>
        /// Déclare la connexion présente sur les expéditions de sa ville (page ouverte) : les autres reçoivent la
        /// liste des présents. Renvoie cette liste à l'appelant. Sans ville, ne fait rien.
        /// </summary>
        public async Task<List<int>> JoinPresence()
        {
            var connectionId = Context.ConnectionId;
            var userId = UserInfoProvider.UserId;
            var townId = CurrentTownId();
            Logger.LogDebug("[{@connectionId}] {@userId} JoinPresence {@townId}", connectionId, userId, townId);
            if (townId <= 0)
            {
                return new List<int>();
            }
            return await JoinPresenceAsync(connectionId, userId, townId);
        }

        /// <summary>Retire la présence de la connexion (page fermée) ; elle reste dans le groupe de sa ville.</summary>
        public async Task LeavePresence()
        {
            var connectionId = Context.ConnectionId;
            var userId = UserInfoProvider.UserId;
            var townId = CurrentTownId();
            Logger.LogDebug("[{@connectionId}] {@userId} LeavePresence {@townId}", connectionId, userId, townId);
            await LeavePresenceAsync(connectionId, userId, townId);
        }

        private async Task JoinTownGroupAsync(string connectionId, int townId)
        {
            _townIdBySocketToken[connectionId] = townId;
            await Groups.AddToGroupAsync(connectionId, townId.ToString());
        }

        private async Task LeaveTownGroupAsync(string connectionId, int userId, int townId)
        {
            _townIdBySocketToken.TryRemove(connectionId, out _);
            await Groups.RemoveFromGroupAsync(connectionId, townId.ToString());
            await LeavePresenceAsync(connectionId, userId, townId);
        }

        private static bool IsPresent(string connectionId, int townId)
        {
            return _connectedUsersByTownByConnexionId.TryGetValue(townId, out var usersIdByConnexionId)
                && usersIdByConnexionId.ContainsKey(connectionId);
        }

        private async Task<List<int>> JoinPresenceAsync(string connectionId, int userId, int townId)
        {
            var usersIdByConnexionId = _connectedUsersByTownByConnexionId.GetOrAdd(townId, _ => new ConcurrentDictionary<string, int>());
            usersIdByConnexionId[connectionId] = userId;
            Logger.LogDebug("[{@connectionId}] User {@userId} added to list of connected users", connectionId, userId);
            var connectedUserOnTown = usersIdByConnexionId.Values.Distinct().ToList();
            var connectedUserOnTownAsJson = connectedUserOnTown.ToJson();
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.UserJoined.GetDescription(), connectedUserOnTownAsJson);
            Logger.LogDebug("[{@connectionId}] Sent to Group({@townId}) UserJoined : {@connectedUserOnTownAsJson}", connectionId, townId, connectedUserOnTownAsJson);
            return connectedUserOnTown;
        }

        private async Task LeavePresenceAsync(string connectionId, int userId, int townId)
        {
            if (!_connectedUsersByTownByConnexionId.TryGetValue(townId, out var usersIdByConnexionId)
                || !usersIdByConnexionId.TryRemove(connectionId, out _))
            {
                return;
            }
            var connectedUserOnTown = usersIdByConnexionId.Values.Distinct().ToList();
            if (!connectedUserOnTown.Contains(userId))
            {
                var connectedUserOnTownAsJson = connectedUserOnTown.ToJson();
                await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.UserLeft.GetDescription(), connectedUserOnTownAsJson);
                Logger.LogDebug("[{@connectionId}] Sent to Group({@townId}) UserLeft : {@connectedUserOnTownAsJson}", connectionId, townId, connectedUserOnTownAsJson);
            }
            if (usersIdByConnexionId.IsEmpty)
            {
                _connectedUsersByTownByConnexionId.TryRemove(townId, out _);
            }
        }

        /// <summary>Ville suivie par la connexion (cf. JoinTown), à défaut celle du jeton.</summary>
        private int CurrentTownId()
        {
            return _townIdBySocketToken.TryGetValue(Context.ConnectionId, out var townId)
                ? townId
                : UserInfoProvider.TownDetail?.TownId ?? 0;
        }

        public async Task PostExpedition(int townId, int day, string expeditionAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} in {@townId} for day {@day} PostExpedition : {@expeditionAsJson}", userId, townId, day, expeditionAsJson);
            var expedition = expeditionAsJson.FromJson<ExpeditionRequestDto>();
            var savedExpedition = await ExpeditionService.SaveExpeditionAsync(expedition, townId, day);
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionUpdated.GetDescription(), savedExpedition);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionUpdated: {@savedExpedition}", townId, savedExpedition.ToJson());
        }

        public async Task DeleteExpedition(int expeditionId)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} DeleteExpedition : {@expeditionId}", userId, expeditionId);
            ExpeditionService.DeleteExpedition(expeditionId);
            var townId = CurrentTownId();
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionDeleted.GetDescription(), expeditionId);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionDeleted: {@expeditionId}", townId, expeditionId);
            await SendMapRouteChangesAsync(townId);
        }

        public async Task CopyExpeditions(int townId, int fromDay, int targetDay)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} in {@townId} for day {@fromDay} to day {@targetDay} CopyExpeditions", userId, townId, fromDay, targetDay);
            if (fromDay < 1)
            {
                throw new MhoTechnicalException($"{nameof(fromDay)} should be > 0");
            }
            if (targetDay < 1)
            {
                throw new MhoTechnicalException($"{nameof(targetDay)} should be > 0");
            }
            if (fromDay == targetDay)
            {
                throw new MhoTechnicalException($"{nameof(fromDay)} should be different from {nameof(targetDay)}");
            }
            var newExpeditions = await ExpeditionService.CopyExpeditionsAsync(townId, fromDay, targetDay);
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionsUpdated.GetDescription(), newExpeditions);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionsUpdated: {@newExpeditions}", townId, newExpeditions.ToJson());
            await SendMapRouteChangesAsync(townId);
        }

        public async Task PostExpeditionPart(int expeditionId, string expeditionPartAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} PostExpeditionPart {@expeditionId} : {@expeditionPartAsJson}", userId, expeditionId, expeditionPartAsJson);
            var expeditionPart = expeditionPartAsJson.FromJson<ExpeditionPartRequestDto>();
            var expeditionPartResult = await ExpeditionService.SaveExpeditionPartAsync(expeditionId, expeditionPart);
            var townId = CurrentTownId();
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionPartUpdated.GetDescription(), expeditionPartResult);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionPartUpdated: {@expeditionPartResult}", townId, expeditionPartResult.ToJson());
            await SendMapRouteChangesAsync(townId);
        }

        public async Task DeleteExpeditionPart(int expeditionPartId)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} DeleteExpeditionPart : {@expeditionPartId}", userId, expeditionPartId);
            ExpeditionService.DeleteExpeditionPart(expeditionPartId);
            var townId = CurrentTownId();
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionPartDeleted.GetDescription(), expeditionPartId);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionPartDeleted: {@expeditionPartId}", townId, expeditionPartId);
            await SendMapRouteChangesAsync(townId);
        }

        public async Task PostExpeditionCitizen(int expeditionPartId, string expeditionCitizenAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} PostExpeditionCitizen {@expeditionPartId} : {@expeditionCitizenAsJson}", userId, expeditionPartId, expeditionCitizenAsJson);
            var expeditionCitizen = expeditionCitizenAsJson.FromJson<ExpeditionCitizenRequestDto>();
            var returnedExpeditionCitizen = await ExpeditionService.SaveExpeditionCitizenAsync(expeditionPartId, expeditionCitizen);
            var townId = CurrentTownId();
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionCitizenUpdated.GetDescription(), returnedExpeditionCitizen);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionCitizenUpdated: {@returnedExpeditionCitizen}", townId, returnedExpeditionCitizen);
        }

        public async Task DeleteExpeditionCitizen(int expeditionCitizenId)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} DeleteExpeditionCitizen : {@expeditionCitizenId}", userId, expeditionCitizenId);
            ExpeditionService.DeleteExpeditionCitizen(expeditionCitizenId);
            var townId = CurrentTownId();
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionCitizenDeleted.GetDescription(), expeditionCitizenId);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionCitizenDeleted: {@expeditionCitizenId}", townId, expeditionCitizenId);
        }

        public async Task PostPartOrders(int expeditionPartId, string expeditionOrderAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} PostPartOrders {@expeditionPartId} : {@expeditionOrderAsJson}", userId, expeditionPartId, expeditionOrderAsJson);
            var expeditionOrders = expeditionOrderAsJson.FromJson<List<ExpeditionOrderDto>>();
            var returnedOrder = await ExpeditionService.SavePartOrdersAsync(expeditionPartId, expeditionOrders);
            var townId = CurrentTownId();
            // Toutes les consignes de la partie, puis la partie : une liste vide dit qu'elles ont toutes été retirées.
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionPartOrdersUpdated.GetDescription(), returnedOrder, expeditionPartId);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionPartOrdersUpdated: {@returnedOrder}", townId, returnedOrder.ToJson());
        }

        public async Task PostCitizenOrders(int expeditionCitizenId, string expeditionOrderAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} PostCitizenOrders {@expeditionCitizenId} : {@expeditionOrderAsJson}", userId, expeditionCitizenId, expeditionOrderAsJson);
            var expeditionOrders = expeditionOrderAsJson.FromJson<List<ExpeditionOrderDto>>();
            var returnedOrder = await ExpeditionService.SaveCitizenOrdersAsync(expeditionCitizenId, expeditionOrders);
            var townId = CurrentTownId();
            // Toutes les consignes du citoyen, puis le citoyen : une liste vide dit qu'elles ont toutes été retirées.
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionCitizenOrdersUpdated.GetDescription(), returnedOrder, expeditionCitizenId);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionCitizenOrdersUpdated: {@returnedOrder}", townId, returnedOrder.ToJson());
        }

        public async Task DeleteExpeditionOrder(int expeditionOrderId)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} DeleteExpeditionOrder : {@expeditionOrderId}", userId, expeditionOrderId);
            ExpeditionService.DeleteExpeditionOrder(expeditionOrderId);
            var townId = CurrentTownId();
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionOrderDeleted.GetDescription(), expeditionOrderId);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionOrderDeleted: {@expeditionOrderId}", townId, expeditionOrderId);
        }

        public async Task SaveExpeditionOrder(string expeditionOrderAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} SaveExpeditionOrder {@expeditionOrderAsJson}", userId, expeditionOrderAsJson);
            var expeditionOrder = expeditionOrderAsJson.FromJson<ExpeditionOrderDto>();
            if (!expeditionOrder.Id.HasValue)
            {
                throw new MhoTechnicalException($"{nameof(expeditionOrder.Id)} cannot be empty");
            }
            var updatedDto = ExpeditionService.UpdateExpeditionOrder(expeditionOrder);
            var townId = CurrentTownId();
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionOrderUpdated.GetDescription(), updatedDto);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionOrderUpdated: {@updatedDto}", townId, updatedDto.ToJson());
        }

        public async Task SaveExpeditionBag(int citizenId, string expeditionBagDtoAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} SaveExpeditionBag {@citizenId} : {@expeditionBagDtoAsJson}", userId, citizenId, expeditionBagDtoAsJson);
            var expeditionBagDto = expeditionBagDtoAsJson.FromJson<ExpeditionBagRequestDto>();
            var updatedDto = await ExpeditionService.UpdateExpeditionBag(citizenId, expeditionBagDto);
            var townId = CurrentTownId();
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionBagUpdated.GetDescription(), updatedDto);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionBagUpdated: {@updatedDto}", townId, updatedDto.ToJson());
        }

        public async Task DeleteExpeditionBag(int bagId)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} DeleteExpeditionBag {@bagId}", userId, bagId);
            var replacementBags = ExpeditionService.DeleteExpeditionBag(bagId);
            var townId = CurrentTownId();
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionBagDeleted.GetDescription(), bagId);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionBagDeleted: {@bagId}", townId, bagId);
            foreach (var replacementBag in replacementBags)
            {
                await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionBagUpdated.GetDescription(), replacementBag);
                Logger.LogDebug("Sent to Group({@townId}) ExpeditionBagUpdated: {@replacementBag}", townId, replacementBag.ToJson());
            }
        }

        /// <summary>
        /// Crée ou modifie un tracé et le renvoie à l'appelant. Les autres clients de la ville reçoivent seulement
        /// MapRouteChanged (id, version) et relisent le tracé s'ils peuvent le voir. Une version périmée est
        /// relayée par une HubException dont le message commence par <see cref="MhoConflictException.HubMessagePrefix"/>.
        /// </summary>
        public async Task<MapRouteDto> SaveMapRoute(int mapId, string mapRouteAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} in {@mapId} SaveMapRoute : {@mapRouteAsJson}", userId, mapId, mapRouteAsJson);
            var request = mapRouteAsJson.FromJson<MapRouteRequestDto>();
            MapRouteDto savedRoute;
            try
            {
                savedRoute = await MapRouteService.SaveMapRouteAsync(mapId, request);
            }
            catch (MhoConflictException e)
            {
                throw new HubException(MhoConflictException.HubMessagePrefix + e.Message);
            }
            var change = new MapRouteChangeDto { Id = savedRoute.Id, Version = savedRoute.Version };
            await Clients.Group(mapId.ToString()).SendAsync(ExpeditionsHubEvent.MapRouteChanged.GetDescription(), change);
            Logger.LogDebug("Sent to Group({@mapId}) MapRouteChanged: {@routeId} v{@version}", mapId, change.Id, change.Version);
            await SendLinkedPartsAsync(mapId, savedRoute);
            return savedRoute;
        }

        /// <summary>Rediffuse les parties liées au tracé : leur direction et leur tracé suivent ses cases.</summary>
        private async Task SendLinkedPartsAsync(int mapId, MapRouteDto route)
        {
            if (route.LinkedParts.Count == 0)
            {
                return;
            }
            var parts = await ExpeditionService.GetExpeditionPartsAsync(route.LinkedParts.Select(part => part.PartId).ToList());
            foreach (var part in parts)
            {
                await Clients.Group(mapId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionPartUpdated.GetDescription(), part);
                Logger.LogDebug("Sent to Group({@mapId}) ExpeditionPartUpdated: {@partId}", mapId, part.Id);
            }
        }

        /// <summary>Copie un itinéraire du jeu en tracé MHO, renvoyé à l'appelant et annoncé à la ville.</summary>
        public async Task<MapRouteDto> CopyGameRoute(int mapId, int gameRouteId)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} in {@mapId} CopyGameRoute : {@gameRouteId}", userId, mapId, gameRouteId);
            var savedRoute = await MapRouteService.CopyGameRouteAsync(mapId, gameRouteId);
            var change = new MapRouteChangeDto { Id = savedRoute.Id, Version = savedRoute.Version };
            await Clients.Group(mapId.ToString()).SendAsync(ExpeditionsHubEvent.MapRouteChanged.GetDescription(), change);
            Logger.LogDebug("Sent to Group({@mapId}) MapRouteChanged: {@routeId} v{@version}", mapId, change.Id, change.Version);
            return savedRoute;
        }

        /// <summary>Diffuse les tracés dont les parties liées viennent de changer (cf. IExpeditionService.TakeMapRouteChanges).</summary>
        private async Task SendMapRouteChangesAsync(int mapId)
        {
            foreach (var change in ExpeditionService.TakeMapRouteChanges())
            {
                await Clients.Group(mapId.ToString()).SendAsync(ExpeditionsHubEvent.MapRouteChanged.GetDescription(), change);
                Logger.LogDebug("Sent to Group({@mapId}) MapRouteChanged: {@routeId} v{@version}", mapId, change.Id, change.Version);
            }
        }

        public async Task DeleteMapRoute(int routeId)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} DeleteMapRoute : {@routeId}", userId, routeId);
            var mapId = await MapRouteService.DeleteMapRouteAsync(routeId);
            await Clients.Group(mapId.ToString()).SendAsync(ExpeditionsHubEvent.MapRouteDeleted.GetDescription(), routeId);
            Logger.LogDebug("Sent to Group({@mapId}) MapRouteDeleted: {@routeId}", mapId, routeId);
        }
    }

    public enum ExpeditionsHubEvent
    {
        [Description("ExpeditionUpdated")]
        ExpeditionUpdated,
        [Description("ExpeditionsUpdated")]
        ExpeditionsUpdated,
        [Description("ExpeditionDeleted")]
        ExpeditionDeleted,
        [Description("ExpeditionPartUpdated")]
        ExpeditionPartUpdated,
        [Description("ExpeditionPartDeleted")]
        ExpeditionPartDeleted,
        [Description("ExpeditionCitizenUpdated")]
        ExpeditionCitizenUpdated,
        [Description("ExpeditionCitizenDeleted")]
        ExpeditionCitizenDeleted,
        [Description("ExpeditionPartOrdersUpdated")]
        ExpeditionPartOrdersUpdated,
        [Description("ExpeditionCitizenOrdersUpdated")]
        ExpeditionCitizenOrdersUpdated,
        [Description("ExpeditionOrderDeleted")]
        ExpeditionOrderDeleted,
        [Description("ExpeditionOrderUpdated")]
        ExpeditionOrderUpdated,
        [Description("ExpeditionBagUpdated")]
        ExpeditionBagUpdated,
        [Description("ExpeditionBagDeleted")]
        ExpeditionBagDeleted,
        [Description("UserJoined")]
        UserJoined,
        [Description("UserLeft")]
        UserLeft,
        [Description("MapRouteChanged")]
        MapRouteChanged,
        [Description("MapRouteDeleted")]
        MapRouteDeleted
    }
}
