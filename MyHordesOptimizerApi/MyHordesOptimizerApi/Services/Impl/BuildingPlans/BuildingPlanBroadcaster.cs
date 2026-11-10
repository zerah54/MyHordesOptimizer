using Microsoft.AspNetCore.SignalR;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Hubs;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.BuildingPlans
{
    public class BuildingPlanBroadcaster : IBuildingPlanBroadcaster
    {
        private readonly IHubContext<BuildingPlansHub> _hubContext;

        public BuildingPlanBroadcaster(IHubContext<BuildingPlansHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public Task PlanSavedAsync(int mapId, BuildingPlanDto plan, string? exceptConnectionId)
        {
            return SendAsync(mapId, BuildingPlansHubEvent.PlanSaved, plan, exceptConnectionId);
        }

        public Task PlanDeletedAsync(int mapId, int planId, string? exceptConnectionId)
        {
            return SendAsync(mapId, BuildingPlansHubEvent.PlanDeleted, planId, exceptConnectionId);
        }

        public Task PlanEffectiveChangedAsync(int mapId, BuildingPlanDto plan, string? exceptConnectionId)
        {
            return SendAsync(mapId, BuildingPlansHubEvent.PlanEffectiveChanged, plan, exceptConnectionId);
        }

        public Task SettingsSavedAsync(int mapId, BuildingPlansDto plans, string? exceptConnectionId)
        {
            return SendAsync(mapId, BuildingPlansHubEvent.SettingsSaved, plans, exceptConnectionId);
        }

        public Task PlanLockChangedAsync(int mapId, PlanLockDto lockDto)
        {
            return SendAsync(mapId, BuildingPlansHubEvent.PlanLockChanged, lockDto, null);
        }

        private Task SendAsync(int mapId, BuildingPlansHubEvent hubEvent, object payload, string? exceptConnectionId)
        {
            var group = mapId.ToString();
            var clients = exceptConnectionId is null ? _hubContext.Clients.Group(group) : _hubContext.Clients.GroupExcept(group, exceptConnectionId);
            return clients.SendAsync(hubEvent.GetDescription(), payload);
        }
    }
}
