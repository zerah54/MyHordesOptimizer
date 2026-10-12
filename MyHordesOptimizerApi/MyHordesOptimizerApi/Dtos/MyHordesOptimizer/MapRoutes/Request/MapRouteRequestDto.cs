using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes.Request
{
    public class MapRouteRequestDto
    {
        /// <summary>Absent : création.</summary>
        public int? Id { get; set; }

        /// <summary>Version lue avant modification (obligatoire pour une modification).</summary>
        public int? Version { get; set; }

        public string Label { get; set; } = null!;

        /// <summary>Clé de palette. Absente à la création : tirée au hasard.</summary>
        public string? Color { get; set; }

        public bool IsPrivate { get; set; }
        public bool IsEditableByAll { get; set; }

        /// <summary>Citoyens autorisés à voir le tracé privé ; ignoré pour un tracé visible de toute la ville.</summary>
        public List<int>? SharedUserIds { get; set; }

        public List<MapRoutePointDto> Cells { get; set; } = new();
        public List<MapRouteStopDto> Stops { get; set; } = new();
    }
}
