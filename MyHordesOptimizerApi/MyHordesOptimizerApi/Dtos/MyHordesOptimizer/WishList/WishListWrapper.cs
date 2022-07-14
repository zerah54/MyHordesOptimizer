using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class WishListWrapper
    {
        public List<WishListItem> WishList { get; set; }
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public WishListWrapper()
        {
            WishList = new List<WishListItem>();
        }
    }
}
