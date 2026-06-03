using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList
{
    public class FlatWishListDto
    {
        public List<WishListItemDto> WishList { get; set; }
        public LastUpdateInfoDto LastUpdateInfo { get; set; }

        public FlatWishListDto()
        {
            WishList = new List<WishListItemDto>();
        }
    }
}
