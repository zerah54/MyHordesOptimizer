using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class WishListLastUpdate
    {
        public Dictionary<int,List<WishListItem>> WishList { get; set; }
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public WishListLastUpdate()
        {
            WishList = new Dictionary<int, List<WishListItem>>();
        }
    }
}
