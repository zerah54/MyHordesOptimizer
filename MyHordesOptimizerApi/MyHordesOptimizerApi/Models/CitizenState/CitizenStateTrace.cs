using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models.CitizenState
{
    public class CitizenStateStepResult
    {
        public string Description { get; set; } = null!;
        public CitizenState StateAfter { get; set; } = null!;
    }

    public class CitizenStateTrace
    {
        public CitizenState StartingState { get; set; } = null!;
        public List<CitizenStateStepResult> Steps { get; set; } = new();
    }
}
