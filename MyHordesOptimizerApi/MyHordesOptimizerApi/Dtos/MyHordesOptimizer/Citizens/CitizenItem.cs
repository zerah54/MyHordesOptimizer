using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens
{
    public class CitizenItem
    {
        public Item Item { get; set; }
        public bool IsBroken { get; set; }
        public int Count { get; set; }
    }
}
