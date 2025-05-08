using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class ItemComponentRecipeDto
    {
        public ItemWithoutRecipeDto Item { get; set; }
        public int Count { get; set; }
    }
}
