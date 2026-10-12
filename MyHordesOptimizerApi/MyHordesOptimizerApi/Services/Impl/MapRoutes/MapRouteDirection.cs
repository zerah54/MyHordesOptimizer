using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Extensions;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Impl.MapRoutes
{
    /// <summary>Direction d'une partie d'expédition déduite de son tracé.</summary>
    public static class MapRouteDirection
    {
        /// <summary>
        /// Octant (<see cref="ZoneGeometry.Direction"/>) du premier déplacement du tracé, de sa première case à la
        /// première case différente (depuis la ville quand le tracé en part) ; null si le tracé ne se déplace pas.
        /// </summary>
        /// <param name="cells">Cases en coordonnées absolues.</param>
        public static DirectionEnum? FirstCell(IEnumerable<MapRoutePointDto> cells)
        {
            MapRoutePointDto? origin = null;
            foreach (var cell in cells)
            {
                origin ??= cell;
                // Le nord vers les y positifs, donc y absolu décroissant (cf. DigRegeneration.ApplyNight).
                var x = cell.X - origin.X;
                var y = origin.Y - cell.Y;
                if (x != 0 || y != 0)
                {
                    return ZoneGeometry.Direction(x, y);
                }
            }
            return null;
        }
    }
}
