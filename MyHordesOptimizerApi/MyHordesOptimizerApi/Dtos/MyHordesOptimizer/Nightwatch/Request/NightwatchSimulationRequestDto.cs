using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch.Request
{
    public class NightwatchSimulationRequestDto
    {
        /// <summary>Null = création.</summary>
        public int? Id { get; set; }
        public string Name { get; set; } = "";
        public int LastDay { get; set; }
        /// <summary>Par <c>Item.IdItem</c>.</summary>
        public Dictionary<int, int> Stock { get; set; } = new();
        /// <summary>Obligatoire pour une modification.</summary>
        public int? Version { get; set; }
    }
}
