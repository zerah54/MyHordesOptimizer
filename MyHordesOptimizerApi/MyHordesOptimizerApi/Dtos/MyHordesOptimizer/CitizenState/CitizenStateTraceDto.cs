using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.CitizenState
{
    public class CitizenStateTraceDto
    {
        public CitizenStateDto StartingState { get; set; } = null!;
        public List<CitizenStateStepResultDto> Steps { get; set; } = new();
    }
}
