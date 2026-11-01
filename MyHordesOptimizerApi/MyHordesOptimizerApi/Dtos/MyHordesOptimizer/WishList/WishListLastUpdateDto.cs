using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class WishListLastUpdateDto
    {
        public List<WishListItemDto> WishList { get; set; }
        public LastUpdateInfoDto LastUpdateInfo { get; set; } = null!;

        public WishListLastUpdateDto()
        {
            WishList = new List<WishListItemDto>();
        }
    }
}
