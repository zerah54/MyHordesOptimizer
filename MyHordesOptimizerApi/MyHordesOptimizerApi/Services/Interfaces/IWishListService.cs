using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IWishListService
    {
        WishListLastUpdateDto GetWishList(int townId);
        WishListLastUpdateDto PutWishList(int townId, int userId, List<WishListPutResquestDto> wishList);
        WishListLastUpdateDto CreateFromTemplate(int townId, int userId, int templateId);
        void AddItemToWishList(int townId, int userId, int itemId, int zoneXPa);
        List<WishlistCategorieDto> GetWishListCategories();
        List<WishlistTemplateDto> GetWishListTemplates();
    }
}
