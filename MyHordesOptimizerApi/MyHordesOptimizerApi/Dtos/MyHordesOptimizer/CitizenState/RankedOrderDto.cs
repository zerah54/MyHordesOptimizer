using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.CitizenState
{
    public class RankedOrderDto
    {
        public List<int> Order { get; set; } = new();

        /// <summary>Clé stable (none/drugged/drunk/thirsty/wounded/addicted/dehydrated/dead), jamais un libellé affichable — voir CitizenStateSeverityTier.</summary>
        public string Tier { get; set; } = null!;

        public int? TierReachedAtDistance { get; set; }

        public int TotalDistance { get; set; }

        public CitizenStateDto FinalState { get; set; } = null!;
    }
}
