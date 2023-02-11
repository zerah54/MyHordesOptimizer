using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class WishListWrapper
    {
        public Dictionary<int,List<WishListItem>> WishList { get; set; }
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public WishListWrapper()
        {
            WishList = new Dictionary<int, List<WishListItem>>();
        }
    }
}
