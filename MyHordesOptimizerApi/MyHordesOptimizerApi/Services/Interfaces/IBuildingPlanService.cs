using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans.Request;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>Propositions de plan de chantiers par ville et par jour, et réglages de valeur des objets.</summary>
    public interface IBuildingPlanService
    {
        /// <summary>Propositions et réglages ; rien (Access.IsCitizen=false) pour qui n'est pas citoyen de la ville.</summary>
        /// <param name="mapId">MapId envoyé par le client (résolu ici).</param>
        Task<BuildingPlansDto> GetPlansAsync(int mapId);

        /// <summary>État synchronisé des chantiers de la ville ; vide pour un non-citoyen.</summary>
        Task<BuildingPlanStateDto> GetStateAsync(int mapId);

        /// <summary>
        /// Crée (sans Id) ou modifie une proposition. Lève <see cref="Exceptions.MhoForbiddenException"/> sans les droits ou
        /// pour une proposition d'une autre ville, <see cref="Exceptions.MhoConflictException"/> si la version est périmée,
        /// <see cref="Exceptions.MhoTechnicalException"/> si la requête est invalide.
        /// </summary>
        Task<BuildingPlanDto> SavePlanAsync(int mapId, BuildingPlanRequestDto request);

        /// <summary>Supprime une proposition de la ville.</summary>
        Task DeletePlanAsync(int mapId, int planId);

        /// <summary>Rend une proposition effective pour son jour ; les autres du jour ne le sont plus.</summary>
        Task<BuildingPlanDto> SetEffectiveAsync(int mapId, int planId);

        /// <summary>Enregistre la valeur en PA des objets de la ville.</summary>
        Task<BuildingPlansDto> SaveSettingsAsync(int mapId, BuildingPlanSettingsRequestDto request);
    }
}
