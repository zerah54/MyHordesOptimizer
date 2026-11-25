using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch
{
    public class NightwatchSimulationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        /// <summary>Dernier jour simulable.</summary>
        public int LastDay { get; set; }
        /// <summary>Stock hypothétique, par <c>Item.IdItem</c>.</summary>
        public Dictionary<int, int> Stock { get; set; } = new();
        public int Version { get; set; }
        public LastUpdateInfoDto? LastUpdateInfo { get; set; }
    }
}
