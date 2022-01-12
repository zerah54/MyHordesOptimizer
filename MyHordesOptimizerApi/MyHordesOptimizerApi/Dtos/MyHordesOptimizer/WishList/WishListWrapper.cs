using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class WishListWrapper
    {
        public Dictionary<string, WishListItem> WishList { get; set; }
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public WishListWrapper()
        {
            WishList = new Dictionary<string, WishListItem>();
        }
    }
}
