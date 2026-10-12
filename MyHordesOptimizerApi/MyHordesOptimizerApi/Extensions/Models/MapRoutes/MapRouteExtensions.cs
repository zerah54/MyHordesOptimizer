using MyHordesOptimizerApi.Models;
using System.Linq;

namespace MyHordesOptimizerApi.Extensions.Models.MapRoutes
{
    public static class MapRouteExtensions
    {
        /// <summary>
        /// Nouvel exemplaire du tracé (copie d'un jour à l'autre) : même contenu, mêmes droits et autorisations,
        /// dernière modification conservée, version remise à 0. Ni identifiant ni partie liée.
        /// </summary>
        public static MapRoute Copy(this MapRoute source)
        {
            return new MapRoute
            {
                IdTown = source.IdTown,
                Label = source.Label,
                Color = source.Color,
                IdAuthor = source.IdAuthor,
                IsPrivate = source.IsPrivate,
                IsEditableByAll = source.IsEditableByAll,
                Cells = source.Cells,
                Stops = source.Stops,
                Length = source.Length,
                Version = 0,
                IdLastUpdateInfo = source.IdLastUpdateInfo,
                MapRouteShares = source.MapRouteShares.Select(share => new MapRouteShare { IdUser = share.IdUser }).ToList()
            };
        }
    }
}
