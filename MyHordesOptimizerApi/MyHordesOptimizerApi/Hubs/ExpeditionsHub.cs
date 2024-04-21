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
            _townIdBySocketToken.TryAdd(Context.ConnectionId, townId);
            await Groups.AddToGroupAsync(Context.ConnectionId, townId.ToString());
            await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.UserJoined.GetDescription(), userId.ToString());
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_townIdBySocketToken.TryGetValue(Context.ConnectionId, out var townId))
            {
                var userId = UserInfoProvider.UserId;
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, townId.ToString());
                await Clients.Group(townId.ToString()).SendAsync(ExpeditionsHubEvent.UserLeft.GetDescription(), userId.ToString());
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task PostExpedition(int townId, int day, string expeditionAsJson)
        {
            var expedition = expeditionAsJson.FromJson<ExpeditionRequestDto>();
            var savedExpedition = await ExpeditionService.SaveExpeditionAsync(expedition, townId, day);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionUpdated.GetDescription(), savedExpedition);
        }

        public async Task DeleteExpedition(int expeditionId)
        {
            ExpeditionService.DeleteExpedition(expeditionId);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionDeleted.GetDescription(), expeditionId);
        }

        public async Task CopyExpeditions(int townId, int fromDay, int targetDay)
        {
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
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionsUpdated.GetDescription(), newExpeditions);
        }

        public async Task PostExpeditionPart(int expeditionId, string expeditionPartAsJson)
        {
            var expeditionPart = expeditionPartAsJson.FromJson<ExpeditionPartRequestDto>();
            var expeditionPartResult = await ExpeditionService.SaveExpeditionPartAsync(expeditionId, expeditionPart);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionPartUpdated.GetDescription(), expeditionPartResult);
        }

        public async Task DeleteExpeditionPart(int expeditionPartId)
        {
            ExpeditionService.DeleteExpeditionPart(expeditionPartId);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionPartDeleted.GetDescription(), expeditionPartId);
        }

        public async Task PostExpeditionCitizen(int expeditionPartId, string expeditionCitizenAsJson)
        {
            var expeditionCitizen = expeditionCitizenAsJson.FromJson<ExpeditionCitizenRequestDto>();
            var returnedExpeditionCitizen = await ExpeditionService.SaveExpeditionCitizenAsync(expeditionPartId, expeditionCitizen);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionCitizenUpdated.GetDescription(), returnedExpeditionCitizen);
        }

        public async Task DeleteExpeditionCitizen(int expeditionCitizenId)
        {
            ExpeditionService.DeleteExpeditionCitizen(expeditionCitizenId);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionCitizenDeleted.GetDescription(), expeditionCitizenId);
        }

        public async Task PostPartOrders(int expeditionPartId, string expeditionOrderAsJson)
        {
            var expeditionOrders = expeditionOrderAsJson.FromJson<List<ExpeditionOrderDto>>();
            var returnedOrder = await ExpeditionService.SavePartOrdersAsync(expeditionPartId, expeditionOrders);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionPartOrdersUpdated.GetDescription(), returnedOrder);
        }

        public async Task PostCitizenOrders(int expeditionCitizenId, string expeditionOrderAsJson)
        {
            var expeditionOrders = expeditionOrderAsJson.FromJson<List<ExpeditionOrderDto>>();
            var returnedOrder = await ExpeditionService.SaveCitizenOrdersAsync(expeditionCitizenId, expeditionOrders);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionCitizenOrdersUpdated.GetDescription(), returnedOrder);
        }

        public async Task DeleteExpeditionOrder(int expeditionOrderId)
        {
            ExpeditionService.DeleteExpeditionOrder(expeditionOrderId);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionOrderDeleted.GetDescription(), expeditionOrderId);
        }

        public async Task SaveExpeditionOrder(string expeditionOrderAsJson)
        {
            var expeditionOrder = expeditionOrderAsJson.FromJson<ExpeditionOrderDto>();
            if (!expeditionOrder.Id.HasValue)
            {
                throw new MhoTechnicalException($"{nameof(expeditionOrder.Id)} cannot be empty");
            }
            var updatedDto = ExpeditionService.UpdateExpeditionOrder(expeditionOrder);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionOrderUpdated.GetDescription(), updatedDto);
        }

        public async Task SaveExpeditionBag(int citizenId, string expeditionBagDtoAsJson)
        {
            var expeditionBagDto = expeditionBagDtoAsJson.FromJson<ExpeditionBagRequestDto>();
            var updatedDto = ExpeditionService.UpdateExpeditionBag(citizenId, expeditionBagDto);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionBagUpdated.GetDescription(), updatedDto);
        }

        public async Task DeleteExpeditionBag(int bagId)
        {
            ExpeditionService.DeleteExpeditionBag(bagId);
            await Clients.Group(UserInfoProvider.TownDetail.TownId.ToString()).SendAsync(ExpeditionsHubEvent.ExpeditionBagDeleted.GetDescription(), bagId);
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
