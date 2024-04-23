using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.ComponentModel;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Hubs
{
    [Authorize]
    public class ExpeditionsHub : Hub
    {
        protected IExpeditionService ExpeditionService { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected ILogger<AbstractMyHordesOptimizerControllerBase> Logger { get; init; }

        private static ConcurrentDictionary<string, int> _townIdBySocketToken = new();
        private static ConcurrentDictionary<int, List<int>> _connectedUsersByTown = new();

        public ExpeditionsHub(IExpeditionService expeditionService, IUserInfoProvider userInfoProvider, ILogger<AbstractMyHordesOptimizerControllerBase> logger)
        {
            ExpeditionService = expeditionService;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var townId = UserInfoProvider.TownDetail.TownId;
            var userId = UserInfoProvider.UserId;
            var connectionId = Context.ConnectionId;
            Logger.LogDebug("[{@connectionId}] User {@userId} from town {@townId} joined hub", connectionId, userId, townId);
            _townIdBySocketToken.TryAdd(connectionId, townId);
            await Groups.AddToGroupAsync(connectionId, townId.ToString());
            _connectedUsersByTown.TryGetValue(townId, out var usersId);
            if (usersId is null)
            {
                usersId = new List<int>();
            }
            if (!usersId.Contains(userId))
            {
                usersId.Add(userId);
                Logger.LogDebug("[{@connectionId}] User {@userId} added to list of connected users", connectionId, userId);
            }
            _connectedUsersByTown.TryAdd(townId, usersId);
            var connectedUserOnTownAsJson = _connectedUsersByTown[townId].ToJson();
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.UserJoined.GetDescription(), connectedUserOnTownAsJson);
            Logger.LogDebug("[{@connectionId}] Sent to Group({@townId}) UserJoined : {@connectedUserOnTownAsJson}", connectionId, townId, connectedUserOnTownAsJson);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connectionId = Context.ConnectionId;
            if (_townIdBySocketToken.TryGetValue(connectionId, out var townId))
            {
                var userId = UserInfoProvider.UserId;
                Logger.LogDebug("[{@connectionId}] {@userId} Disconnected", connectionId, userId);
                await Groups.RemoveFromGroupAsync(connectionId, townId.ToString());
                var usersId = _connectedUsersByTown[townId];
                usersId.Remove(userId);
                string connectedUserOnTownAsJson = _connectedUsersByTown[townId].ToJson();
                await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.UserLeft.GetDescription(), connectedUserOnTownAsJson);
                Logger.LogDebug("[{@connectionId}] Sent to Group({@townId}) UserLeft : {@connectedUserOnTownAsJson}", connectionId, townId, connectedUserOnTownAsJson);
            }
            await base.OnDisconnectedAsync(exception);
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
            var townId = UserInfoProvider.TownDetail.TownId;
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionDeleted.GetDescription(), expeditionId);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionDeleted: {@expeditionId}", townId, expeditionId);
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
        }

        public async Task PostExpeditionPart(int expeditionId, string expeditionPartAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} PostExpeditionPart {@expeditionId} : {@expeditionPartAsJson}", userId, expeditionId, expeditionPartAsJson);
            var expeditionPart = expeditionPartAsJson.FromJson<ExpeditionPartRequestDto>();
            var expeditionPartResult = await ExpeditionService.SaveExpeditionPartAsync(expeditionId, expeditionPart);
            var townId = UserInfoProvider.TownDetail.TownId;
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionPartUpdated.GetDescription(), expeditionPartResult);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionPartUpdated: {@expeditionPartResult}", townId, expeditionPartResult.ToJson());
        }

        public async Task DeleteExpeditionPart(int expeditionPartId)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} DeleteExpeditionPart : {@expeditionPartId}", userId, expeditionPartId);
            ExpeditionService.DeleteExpeditionPart(expeditionPartId);
            var townId = UserInfoProvider.TownDetail.TownId;
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionPartDeleted.GetDescription(), expeditionPartId);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionPartDeleted: {@expeditionPartId}", townId, expeditionPartId);
        }

        public async Task PostExpeditionCitizen(int expeditionPartId, string expeditionCitizenAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} PostExpeditionCitizen {@expeditionPartId} : {@expeditionCitizenAsJson}", userId, expeditionPartId, expeditionCitizenAsJson);
            var expeditionCitizen = expeditionCitizenAsJson.FromJson<ExpeditionCitizenRequestDto>();
            var returnedExpeditionCitizen = await ExpeditionService.SaveExpeditionCitizenAsync(expeditionPartId, expeditionCitizen);
            var townId = UserInfoProvider.TownDetail.TownId;
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionCitizenUpdated.GetDescription(), returnedExpeditionCitizen);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionCitizenUpdated: {@returnedExpeditionCitizen}", townId, returnedExpeditionCitizen);
        }

        public async Task DeleteExpeditionCitizen(int expeditionCitizenId)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} DeleteExpeditionCitizen : {@expeditionCitizenId}", userId, expeditionCitizenId);
            ExpeditionService.DeleteExpeditionCitizen(expeditionCitizenId);
            var townId = UserInfoProvider.TownDetail.TownId;
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionCitizenDeleted.GetDescription(), expeditionCitizenId);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionCitizenDeleted: {@expeditionCitizenId}", townId, expeditionCitizenId);
        }

        public async Task PostPartOrders(int expeditionPartId, string expeditionOrderAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} PostPartOrders {@expeditionPartId} : {@expeditionOrderAsJson}", userId, expeditionPartId, expeditionOrderAsJson);
            var expeditionOrders = expeditionOrderAsJson.FromJson<List<ExpeditionOrderDto>>();
            var returnedOrder = await ExpeditionService.SavePartOrdersAsync(expeditionPartId, expeditionOrders);
            var townId = UserInfoProvider.TownDetail.TownId;
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionPartOrdersUpdated.GetDescription(), returnedOrder);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionPartOrdersUpdated: {@returnedOrder}", townId, returnedOrder.ToJson());
        }

        public async Task PostCitizenOrders(int expeditionCitizenId, string expeditionOrderAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} PostCitizenOrders {@expeditionCitizenId} : {@expeditionOrderAsJson}", userId, expeditionCitizenId, expeditionOrderAsJson);
            var expeditionOrders = expeditionOrderAsJson.FromJson<List<ExpeditionOrderDto>>();
            var returnedOrder = await ExpeditionService.SaveCitizenOrdersAsync(expeditionCitizenId, expeditionOrders);
            var townId = UserInfoProvider.TownDetail.TownId;
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionCitizenOrdersUpdated.GetDescription(), returnedOrder);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionCitizenOrdersUpdated: {@returnedOrder}", townId, returnedOrder.ToJson());
        }

        public async Task DeleteExpeditionOrder(int expeditionOrderId)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} DeleteExpeditionOrder : {@expeditionOrderId}", userId, expeditionOrderId);
            ExpeditionService.DeleteExpeditionOrder(expeditionOrderId);
            var townId = UserInfoProvider.TownDetail.TownId;
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
            var townId = UserInfoProvider.TownDetail.TownId;
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionOrderUpdated.GetDescription(), updatedDto);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionOrderUpdated: {@updatedDto}", townId, updatedDto.ToJson());
        }

        public async Task SaveExpeditionBag(int citizenId, string expeditionBagDtoAsJson)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} SaveExpeditionBag {@citizenId} : {@expeditionBagDtoAsJson}", userId, citizenId, expeditionBagDtoAsJson);
            var expeditionBagDto = expeditionBagDtoAsJson.FromJson<ExpeditionBagRequestDto>();
            var updatedDto = ExpeditionService.UpdateExpeditionBag(citizenId, expeditionBagDto);
            var townId = UserInfoProvider.TownDetail.TownId;
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionBagUpdated.GetDescription(), updatedDto);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionBagUpdated: {@updatedDto}", townId, updatedDto.ToJson());
        }

        public async Task DeleteExpeditionBag(int bagId)
        {
            var userId = UserInfoProvider.UserId;
            Logger.LogDebug("{@userId} DeleteExpeditionBag {@bagId}", userId, bagId);
            ExpeditionService.DeleteExpeditionBag(bagId);
            var townId = UserInfoProvider.TownDetail.TownId;
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionBagDeleted.GetDescription(), bagId);
            Logger.LogDebug("Sent to Group({@townId}) ExpeditionBagDeleted: {@bagId}", townId, bagId);
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
        UserLeft
    }
}
