using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch.Request;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>Propositions de plan de veille par ville et par jour.</summary>
    public interface INightwatchPlanService
    {
        /// <summary>Propositions ; rien (Access.IsCitizen=false) pour qui n'est pas citoyen de la ville.</summary>
        /// <param name="mapId">MapId envoyé par le client (résolu ici).</param>
        Task<NightwatchPlansDto> GetPlansAsync(int mapId);

        /// <summary>
        /// Crée (sans Id) ou modifie une proposition. Lève <see cref="Exceptions.MhoForbiddenException"/> sans les droits ou
        /// pour une proposition d'une autre ville, <see cref="Exceptions.MhoConflictException"/> si la version est périmée,
        /// <see cref="Exceptions.MhoTechnicalException"/> si la requête est invalide.
        /// </summary>
        Task<NightwatchPlanDto> SavePlanAsync(int mapId, NightwatchPlanRequestDto request);

        /// <summary>État réel de la ville (lecture BDD seule) pour planifier la veille du jour <paramref name="day"/> ; vide pour un non-citoyen.</summary>
        Task<NightwatchStateDto> GetStateAsync(int mapId, int day);

        /// <summary>Supprime une proposition de la ville.</summary>
        Task DeletePlanAsync(int mapId, int planId);

        /// <summary>Rend une proposition effective pour son jour ; les autres du jour ne le sont plus.</summary>
        Task<NightwatchPlanDto> SetEffectiveAsync(int mapId, int planId);
    }
}
