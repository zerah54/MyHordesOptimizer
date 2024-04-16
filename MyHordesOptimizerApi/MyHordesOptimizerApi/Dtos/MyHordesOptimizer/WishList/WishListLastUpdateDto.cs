using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class WishListLastUpdateDto
    {
        public Dictionary<int,List<WishListItemDto>> WishList { get; set; }
        public LastUpdateInfoDto LastUpdateInfo { get; set; }

        public WishListLastUpdateDto()
        {
            WishList = new Dictionary<int, List<WishListItemDto>>();
        }
    }
}
