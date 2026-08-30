using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.CitizenState
{
    public class SuggestOrderRequestDto
    {
        public CitizenStateDto StartingState { get; set; } = null!;
        public List<int> BagItemIds { get; set; } = new();
    }
}
