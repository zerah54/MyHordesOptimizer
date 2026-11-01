using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class ItemComponentRecipeDto
    {
        public ItemWithoutRecipeDto Item { get; set; } = null!;
        public int Count { get; set; }
    }
}
