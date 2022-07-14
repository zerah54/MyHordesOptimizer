using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IWishListService
    {
        WishListWrapper GetWishList(int townId);
        WishListWrapper PutWishList(int townId, int userId, List<WishListPutResquestDto> wishList);
        void AddItemToWishList(int townId, int userId, int itemId);
    }
}
