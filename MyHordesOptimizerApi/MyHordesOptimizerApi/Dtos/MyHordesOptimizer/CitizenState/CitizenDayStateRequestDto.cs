using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.CitizenState
{
    public class CitizenDayStateRequestDto
    {
        public CitizenStateDto StartingState { get; set; } = null!;
        public List<CitizenStateStepDto> Steps { get; set; } = new();
    }
}
