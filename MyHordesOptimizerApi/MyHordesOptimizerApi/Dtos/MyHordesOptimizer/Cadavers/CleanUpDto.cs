using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CleanUpDto
    {
        public int IdCleanUp { get; set; }
        public CitizenDto CitizenCleanUp { get; set; } = null!;
        public CleanUpTypeDto Type { get; set; } = null!;
    }
}
