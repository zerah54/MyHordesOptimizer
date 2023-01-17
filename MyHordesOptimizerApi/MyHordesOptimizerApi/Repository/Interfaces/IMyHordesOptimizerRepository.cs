using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Citizen;
using MyHordesOptimizerApi.Models.Map;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesOptimizerRepository
    {
        void PatchTown(TownModel town);
        Town GetTown(int townId);
        TownModel GetTownModel(int townId);

        void PatchHeroSkill(IEnumerable<HeroSkillsModel> heroSkills);
        IEnumerable<HeroSkill> GetHeroSkills();

        void PatchItems(IEnumerable<ItemModel> items);
        IEnumerable<Item> GetItems();

        void PatchRecipes(IEnumerable<RecipeModel> recipes);
        IEnumerable<ItemRecipe> GetRecipes();
        void DeleteAllRecipeComponents();
        void DeleteAllRecipeResults();
        void PatchRecipeComponents(string recipeName, IEnumerable<string> componentUids);
        void PatchRecipeResults(IEnumerable<RecipeItemResultModel> results);

        void PutBank(int townId, BankWrapper bank);
        BankWrapper GetBank(int townId);

        void PatchCitizen(int townId, CitizensWrapper citizens);
        void PatchCitizenDetail(TownCitizenDetailModel citizenDetail);
        CitizensWrapper GetCitizens(int townId);
        void UpdateCitizenLocation(int townId, int x, int y, IEnumerable<int> citizenId);


        void AddItemToWishlist(int townId, int itemId, int userId);
        void PutWishList(int townId, int userId, IEnumerable<TownWishlistItemModel> items);
        WishListWrapper GetWishList(int townId);

        void PatchRuins(IEnumerable<MyHordesOptimizerRuin> jsonRuins);
        IEnumerable<MyHordesOptimizerRuin> GetRuins();

        void PatchCategories(IEnumerable<CategoryModel> categories);
        IEnumerable<CategoryModel> GetCategories();

        void PatchProperties(IEnumerable<string> allProperties);
        void DeleteAllPropertiesItem();
        void PatchPropertiesItem(string itemUid, IEnumerable<string> properties);

        void PatchActions(IEnumerable<string> allActions);
        void DeleteAllActionsItem();
        void PatchActionsItem(string itemUid, IEnumerable<string> actions);

        void PatchCitizenBags(int townId, LastUpdateInfo lastUpdateInfo, IEnumerable<Citizen> citizens);
        IDictionary<int,int> GetCitizenBagsId(int townId, IEnumerable<int> userIds);
        int GetCitizenBagId(int townId, int userId);
        int CreateLastUpdateInfo(LastUpdateInfo lastUpdateInfo);

        IEnumerable<ParametersModel> GetParameters();
        void PatchParameter(ParametersModel model);


        void PatchMapCell(int townId, IEnumerable<MapCellModel> listCells);
        MapCellCompletModel GetCell(int townId, int x, int y);
        IEnumerable<MapCellCompletModel> GetCells(int townId);
        void PatchMapCellItem(int townId, IEnumerable<MapCellItemModel> listCellItems);
        void PatchCellDig(int townId, IEnumerable<MapCellDigModel> cellDigsToUpdate);
        IEnumerable<MapCellDigCompletModel> GetCellsDigs(int townId);
        MapCellDigUpdate GetMapCellDigUpdate(int id, int days);
        void InsertMapCellDigUpdate(MapCellDigUpdate mapCellDigUpdate);
        void PatchMapCellDig(MapCellDigModel model);
        void DeleteMapCellDig(int idCell, int diggerId, int day);
        MapCellDigCompletModel GetCellDigs(int idCell, int idUser, int day);
        void ClearCellDig(IEnumerable<int> cellId);
    }
}
