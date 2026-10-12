using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes
{
    /// <summary>Itinéraire créé dans MyHordes (lecture seule, jour courant seulement).</summary>
    public class MapRouteGameDto
    {
        public int Id { get; set; }
        public int? AuthorId { get; set; }
        public string Label { get; set; } = null!;
        public int Length { get; set; }

        /// <summary>Points d'arrêt, segments alignés entre eux.</summary>
        public List<MapRoutePointDto> Stops { get; set; } = new();
    }
}
