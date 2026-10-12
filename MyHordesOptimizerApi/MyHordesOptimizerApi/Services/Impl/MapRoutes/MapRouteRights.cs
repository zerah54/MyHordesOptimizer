using MyHordesOptimizerApi.Models;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.MapRoutes
{
    /// <summary>Droits d'un utilisateur sur un tracé, hors règles de ville et de jour (cf. MapRouteService.CanEdit).</summary>
    public static class MapRouteRights
    {
        /// <summary>Tracé de toute la ville, ou privé dont l'utilisateur est l'auteur ou un citoyen autorisé (MapRouteShares chargées).</summary>
        public static bool IsVisible(MapRoute route, int userId)
        {
            return !route.IsPrivate || route.IdAuthor == userId || route.MapRouteShares.Any(share => share.IdUser == userId);
        }

        /// <summary>L'utilisateur peut changer le tracé : il en est l'auteur, ou le tracé est modifiable par tous ceux qui le voient.</summary>
        public static bool IsAuthorOrEditableByAll(MapRoute route, int userId)
        {
            return route.IsEditableByAll || route.IdAuthor == userId;
        }
    }
}
