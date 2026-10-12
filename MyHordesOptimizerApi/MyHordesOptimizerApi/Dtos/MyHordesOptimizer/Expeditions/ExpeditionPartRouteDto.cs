using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions
{
    /// <summary>Tracé lié à une partie d'expédition, ce qu'il faut pour la feuille de route.</summary>
    public class ExpeditionPartRouteDto
    {
        public int Id { get; set; }
        public string Label { get; set; } = null!;

        /// <summary>Clé de palette (cf. MapRoutePalette).</summary>
        public string Color { get; set; } = null!;

        /// <summary>Chemin case par case, en coordonnées absolues.</summary>
        public List<MapRoutePointDto> Cells { get; set; } = new();

        /// <summary>PA du trajet : nombre de cases - 1.</summary>
        public int Length { get; set; }
        public int Version { get; set; }
    }
}
