namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CleanUpDto
    {
        public int IdCleanUp { get; set; }
        public CitizenDto CitizenCleanUp { get; set; }
        public CleanUpTypeDto Type { get; set; }
    }
}
