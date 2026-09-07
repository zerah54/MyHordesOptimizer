using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models.CitizenState
{
    public class SuggestedOrder
    {
        public string Label { get; set; } = null!;
        public List<int> Order { get; set; } = new();
        public CitizenState FinalState { get; set; } = null!;
    }
}
