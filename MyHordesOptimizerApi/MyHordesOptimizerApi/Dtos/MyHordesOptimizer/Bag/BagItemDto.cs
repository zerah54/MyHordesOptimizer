using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Bag
{
    public class BagItemDto
    {
        public ItemDto Item { get; set; }
        public bool IsBroken { get; set; }
        public int Count { get; set; }

        public BagItemDto()
        {
            Item = new ItemDto();
        }
    }
}
