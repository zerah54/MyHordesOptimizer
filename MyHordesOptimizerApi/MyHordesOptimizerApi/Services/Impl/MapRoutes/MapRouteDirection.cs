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
        /// Octant (<see cref="ZoneGeometry.Direction"/>) de la première case du tracé hors de la ville ;
        /// null si le tracé ne quitte pas la ville.
        /// </summary>
        /// <param name="cells">Cases en coordonnées absolues.</param>
        /// <param name="townX">Position absolue de la ville (Town.X).</param>
        /// <param name="townY">Position absolue de la ville (Town.Y).</param>
        public static DirectionEnum? FirstCell(IEnumerable<MapRoutePointDto> cells, int townX, int townY)
        {
            foreach (var cell in cells)
            {
                // Coordonnées relatives à la ville, le nord vers les y positifs (cf. DigRegeneration.ApplyNight).
                var x = cell.X - townX;
                var y = townY - cell.Y;
                if (x != 0 || y != 0)
                {
                    return ZoneGeometry.Direction(x, y);
                }
            }
            return null;
        }
    }
}
