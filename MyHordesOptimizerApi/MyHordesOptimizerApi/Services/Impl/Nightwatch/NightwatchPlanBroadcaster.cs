using Microsoft.AspNetCore.SignalR;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Hubs;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.Nightwatch
{
    public class NightwatchPlanBroadcaster : INightwatchPlanBroadcaster
    {
        private readonly IHubContext<NightwatchPlansHub> _hubContext;

        public NightwatchPlanBroadcaster(IHubContext<NightwatchPlansHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public Task PlanSavedAsync(int mapId, NightwatchPlanDto plan, string? exceptConnectionId)
        {
            return SendAsync(mapId, NightwatchPlansHubEvent.PlanSaved, plan, exceptConnectionId);
        }

        public Task PlanDeletedAsync(int mapId, int planId, string? exceptConnectionId)
        {
            return SendAsync(mapId, NightwatchPlansHubEvent.PlanDeleted, planId, exceptConnectionId);
        }

        public Task PlanEffectiveChangedAsync(int mapId, NightwatchPlanDto plan, string? exceptConnectionId)
        {
            return SendAsync(mapId, NightwatchPlansHubEvent.PlanEffectiveChanged, plan, exceptConnectionId);
        }

        public Task PlanLockChangedAsync(int mapId, PlanLockDto lockDto)
        {
            return SendAsync(mapId, NightwatchPlansHubEvent.PlanLockChanged, lockDto, null);
        }

        public Task SimulationsChangedAsync(int mapId, string? exceptConnectionId)
        {
            return SendAsync(mapId, NightwatchPlansHubEvent.SimulationsChanged, new object(), exceptConnectionId);
        }

        private Task SendAsync(int mapId, NightwatchPlansHubEvent hubEvent, object payload, string? exceptConnectionId)
        {
            var group = mapId.ToString();
            var clients = exceptConnectionId is null ? _hubContext.Clients.Group(group) : _hubContext.Clients.GroupExcept(group, exceptConnectionId);
            return clients.SendAsync(hubEvent.GetDescription(), payload);
        }
    }
}
