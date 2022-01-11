using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IWishListService
    {
        WishListWrapper GetWishList();
        void PutWishList(Dictionary<string, WishListItem> wishList);
        void AddItemToWishList(int itemId);
    }
}
