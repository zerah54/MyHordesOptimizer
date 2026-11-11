using System.Collections.Generic;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class WishListLastUpdateDto
    {
        public List<WishListItemDto> WishList { get; set; }
        public List<WishListGroupDto> Groups { get; set; } = new List<WishListGroupDto>();
        public LastUpdateInfoDto LastUpdateInfo { get; set; } = null!;

        public WishListLastUpdateDto()
        {
            WishList = new List<WishListItemDto>();
        }
    }
}
