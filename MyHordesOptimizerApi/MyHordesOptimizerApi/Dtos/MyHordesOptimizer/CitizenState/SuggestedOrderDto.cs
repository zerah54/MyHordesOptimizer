using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.CitizenState
{
    public class SuggestedOrderDto
    {
        public string Label { get; set; } = null!;
        public List<int> Order { get; set; } = new();
        public CitizenStateDto FinalState { get; set; } = null!;
    }
}
