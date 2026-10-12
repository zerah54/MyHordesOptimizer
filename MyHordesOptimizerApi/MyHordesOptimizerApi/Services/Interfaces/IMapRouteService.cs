using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes.Request;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>Tracés d'expédition saisis sur la carte, et itinéraires du jeu importés.</summary>
    public interface IMapRouteService
    {
        /// <summary>Tracés visibles par l'utilisateur courant et itinéraires du jeu du jour ; rien pour un observateur.</summary>
        /// <param name="mapId">MapId envoyé par le client (résolu ici).</param>
        Task<MapRoutesDto> GetMapRoutesAsync(int mapId);

        /// <summary>
        /// Droits de l'utilisateur courant sur la ville, sans les tracés : le site les lit en observation pour savoir
        /// si l'utilisateur en est un ancien citoyen (expéditions, consignes et tracés modifiables).
        /// </summary>
        /// <param name="mapId">MapId envoyé par le client (résolu ici).</param>
        Task<MapRouteAccessDto> GetAccessAsync(int mapId);

        /// <summary>Un tracé, ou null s'il n'existe pas ou n'est pas visible par l'utilisateur courant.</summary>
        Task<MapRouteDto?> GetMapRouteAsync(int mapId, int routeId);

        /// <summary>
        /// Crée (sans Id) ou modifie un tracé. Lève <see cref="Exceptions.MhoForbiddenException"/> sans les droits,
        /// <see cref="Exceptions.MhoConflictException"/> si la version envoyée n'est plus la dernière,
        /// <see cref="Exceptions.MhoTechnicalException"/> si le tracé est invalide.
        /// </summary>
        Task<MapRouteDto> SaveMapRouteAsync(int mapId, MapRouteRequestDto request);

        /// <summary>
        /// Crée un tracé MHO qui reprend un itinéraire du jeu de la ville (mêmes droits et contrôles qu'une création,
        /// cf. <see cref="SaveMapRouteAsync"/>).
        /// </summary>
        Task<MapRouteDto> CopyGameRouteAsync(int mapId, int gameRouteId);

        /// <summary>Supprime un tracé (les parties liées en sont déliées). Renvoie le mapId de sa ville, clé du groupe temps réel.</summary>
        Task<int> DeleteMapRouteAsync(int routeId);
    }
}
