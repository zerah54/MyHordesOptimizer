using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using System;

namespace MyHordesOptimizerApi.Extensions
{
    /// <summary>
    /// Géométrie d'une case, en coordonnées relatives à la ville (le nord vers les y positifs).
    /// Même calcul que MyHordes (<c>Zone::getDirection</c>, <c>getDistance</c>, <c>getApDistance</c>).
    /// </summary>
    public static class ZoneGeometry
    {
        /// <summary>
        /// Octant de la case vue depuis la ville, celui que le vent de la nuit régénère. La ville
        /// elle-même n'a pas d'octant : l'appelant doit l'exclure.
        /// </summary>
        public static DirectionEnum Direction(int x, int y)
        {
            if (x == 0 && y > 0) return DirectionEnum.North;
            if (x == 0 && y < 0) return DirectionEnum.South;
            if (x > 0 && y == 0) return DirectionEnum.Est;
            if (x < 0 && y == 0) return DirectionEnum.West;

            double deg = (180.0 / Math.PI) * Math.Asin(x / Math.Sqrt((double)(x * x + y * y)));

            if (y > 0)
            {
                if (deg >= 67.5) return DirectionEnum.Est;
                if (deg >= 22.5) return DirectionEnum.NorthEst;
                if (deg >= -22.5) return DirectionEnum.North;
                if (deg >= -67.5) return DirectionEnum.NorthWest;
                return DirectionEnum.West;
            }
            if (deg >= 67.5) return DirectionEnum.Est;
            if (deg >= 22.5) return DirectionEnum.SouthEst;
            if (deg >= -22.5) return DirectionEnum.South;
            if (deg >= -67.5) return DirectionEnum.SouthWest;
            return DirectionEnum.West;
        }

        /// <summary>Distance en kilomètres, arrondie comme le jeu (une racine carrée d'entier ne tombe jamais sur ,5).</summary>
        public static int DistanceKm(int x, int y)
        {
            return (int)Math.Round(Math.Sqrt(Math.Pow(x, 2) + Math.Pow(y, 2)));
        }

        /// <summary>Distance en points d'action : les déplacements se font sur les axes.</summary>
        public static int DistanceAp(int x, int y)
        {
            return Math.Abs(x) + Math.Abs(y);
        }
    }
}
