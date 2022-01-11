using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class WishListWrapper
    {
        public Dictionary<string, WishListItem> WishList { get; set; }
        public LastUpadteInfo LastUpadteInfo { get; set; }

        public WishListWrapper()
        {
            WishList = new Dictionary<string, WishListItem>();
        }
    }
}
