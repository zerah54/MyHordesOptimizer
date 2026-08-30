namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.CitizenState
{
    public class CitizenStateStepResultDto
    {
        public string Description { get; set; } = null!;
        public CitizenStateDto StateAfter { get; set; } = null!;
    }
}
