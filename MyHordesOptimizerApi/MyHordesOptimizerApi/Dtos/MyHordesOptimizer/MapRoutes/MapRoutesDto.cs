using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes
{
    public class MapRoutesDto
    {
        public MapRouteAccessDto Access { get; set; } = new();

        /// <summary>Tracés visibles par l'utilisateur courant.</summary>
        public List<MapRouteDto> Routes { get; set; } = new();

        /// <summary>Itinéraires du jeu du jour courant de la ville.</summary>
        public List<MapRouteGameDto> GameRoutes { get; set; } = new();
    }
}
