using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Hubs;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>Diffuse aux clients de la ville les changements des plans de chantiers ; <c>exceptConnectionId</c> exclut l'auteur.</summary>
    public interface IBuildingPlanBroadcaster
    {
        Task PlanSavedAsync(int mapId, BuildingPlanDto plan, string? exceptConnectionId);
        Task PlanDeletedAsync(int mapId, int planId, string? exceptConnectionId);
        Task PlanEffectiveChangedAsync(int mapId, BuildingPlanDto plan, string? exceptConnectionId);
        Task SettingsSavedAsync(int mapId, BuildingPlansDto plans, string? exceptConnectionId);
        /// <summary>Toujours à tout le groupe : l'auteur du changement doit aussi le recevoir.</summary>
        Task PlanLockChangedAsync(int mapId, PlanLockDto lockDto);
    }
}
