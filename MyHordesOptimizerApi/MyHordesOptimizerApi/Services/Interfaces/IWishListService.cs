using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IWishListService
    {
        WishListLastUpdate GetWishList(int townId);
        WishListLastUpdate PutWishList(int townId, int userId, List<WishListPutResquestDto> wishList);
        WishListLastUpdate CreateFromTemplate(int townId, int userId, int templateId);
        void AddItemToWishList(int townId, int userId, int itemId, int zoneXPa);
        List<WishlistCategorieDto> GetWishListCategories();
        List<WishlistTemplateDto> GetWishListTemplates();
    }
}
