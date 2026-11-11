using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList
{
    public class WishListGroupAddRequestDto
    {
        public string Name { get; set; } = null!;
        public List<int> ItemIds { get; set; } = null!;
        public int ZoneXPa { get; set; }
        public int Count { get; set; }
    }
}
