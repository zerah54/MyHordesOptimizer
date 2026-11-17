using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
using MyHordesOptimizerApi.Hubs;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>Diffuse aux clients de la ville les changements des plans de veille ; <c>exceptConnectionId</c> exclut l'auteur.</summary>
    public interface INightwatchPlanBroadcaster
    {
        Task PlanSavedAsync(int mapId, NightwatchPlanDto plan, string? exceptConnectionId);
        Task PlanDeletedAsync(int mapId, int planId, string? exceptConnectionId);
        Task PlanEffectiveChangedAsync(int mapId, NightwatchPlanDto plan, string? exceptConnectionId);
        /// <summary>Toujours à tout le groupe : l'auteur du changement doit aussi le recevoir.</summary>
        Task PlanLockChangedAsync(int mapId, PlanLockDto lockDto);
    }
}
