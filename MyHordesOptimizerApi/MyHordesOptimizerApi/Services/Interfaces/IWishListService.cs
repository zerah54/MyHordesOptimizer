using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IWishListService
    {
        WishListLastUpdateDto GetWishList(int townId);
        WishListLastUpdateDto PutWishList(int townId, int userId, WishListPutBodyDto body);
        WishListLastUpdateDto AddGroupToWishList(int townId, int userId, WishListGroupAddRequestDto request);
        void AddItemToWishList(int townId, int userId, int itemId, int zoneXPa);
    }
}
