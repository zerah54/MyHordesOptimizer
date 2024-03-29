﻿using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Citizen;
using MyHordesOptimizerApi.Models.Citizen.Bags;
using MyHordesOptimizerApi.Models.Map;
using MyHordesOptimizerApi.Models.Wishlist;
using System.Collections.Generic;
using MyHordesOptimizerApi.Models.Estimations;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesOptimizerRepository
    {
        void PatchTown(TownModel town);
        Town GetTown(int townId);
        TownModel GetTownModel(int townId);

        void PatchHeroSkill(IEnumerable<HeroSkillsModel> heroSkills);
        IEnumerable<HeroSkill> GetHeroSkills();

        void PatchCauseOfDeath(IEnumerable<CauseOfDeathModel> causesOfDeath);
        IEnumerable<CauseOfDeath> GetCausesOfDeath();

        void PatchCleanUpType(IEnumerable<CleanUpTypeModel> causesOfDeath);
        IEnumerable<CleanUpType> GetCleanUpTypes();

        IEnumerable<CleanUp> GetCleanUps();


        void PatchItems(IEnumerable<ItemModel> items);
        IEnumerable<Item> GetItems();

        void PatchRecipes(IEnumerable<RecipeModel> recipes);
        IEnumerable<ItemRecipe> GetRecipes();
        void DeleteAllRecipeComponents();
        void DeleteAllRecipeResults();
        void PatchRecipeComponents(string recipeName, IEnumerable<string> componentUids);
        void PatchRecipeResults(IEnumerable<RecipeItemResultModel> results);

        void PutBank(int townId, BankLastUpdate bank);
        BankLastUpdate GetBank(int townId);

        void PatchCitizen(int townId, CitizensLastUpdate citizens);
        void PatchCitizenDetail(TownCitizenDetailModel citizenDetail);
        CitizensLastUpdate GetCitizens(int townId);
        void UpdateCitizenLocation(int townId, int x, int y, IEnumerable<int> citizenId, int lastUpdateInfoId);

        void PatchCadaver(int townId, CadaversLastUpdate cadavers);
        CadaversLastUpdate GetCadavers(int townId);

        void AddItemToWishlist(int townId, int itemId, int userId, int zoneXPa);
        void PutWishList(int townId, int userId, IEnumerable<TownWishlistItemModel> items);
        WishListLastUpdate GetWishList(int townId);
        void PatchWishlistCategories(List<WishlistCategorieModel> categories);
        void PatchWishlistItemCategories(List<WishlistCategorieItemModel> itemsCategorie);
        IEnumerable<WishlistCategorieCompletModel> GetWishListCategories();
        void PatchDefaultWishlistItems(List<DefaultWishlistItemModel> modeles);
        IEnumerable<DefaultWishlistItemModel> GetWishListTemplate(int templateId);
        IEnumerable<DefaultWishlistItemModel> GetWishListTemplates();

        void PatchRuins(IEnumerable<MyHordesOptimizerRuin> jsonRuins);
        IEnumerable<MyHordesOptimizerRuin> GetRuins();
        IEnumerable<MyHordesOptimizerRuin> GetTownRuin(int value);

        void PatchCategories(IEnumerable<CategoryModel> categories);
        IEnumerable<CategoryModel> GetCategories();

        void PatchProperties(IEnumerable<string> allProperties);
        void DeleteAllPropertiesItem();
        void PatchPropertiesItem(string itemUid, IEnumerable<string> properties);

        void PatchActions(IEnumerable<string> allActions);
        void DeleteAllActionsItem();
        void PatchActionsItem(string itemUid, IEnumerable<string> actions);

        void PatchCitizenBags(int townId, LastUpdateInfo lastUpdateInfo, IEnumerable<Citizen> citizens);
        IDictionary<int, int> GetCitizenBagsId(int townId, IEnumerable<int> userIds);
        int GetCitizenBagId(int townId, int userId);
        IEnumerable<BagItem> GetAllBagItems(int townId);


        int CreateLastUpdateInfo(LastUpdateInfo lastUpdateInfo);

        IEnumerable<ParametersModel> GetParameters();
        void PatchParameter(ParametersModel model);


        void PatchMapCell(int townId, IEnumerable<MapCellModel> listCells, bool forceUpdate);
        MapCellCompletModel GetCell(int townId, int x, int y);
        IEnumerable<MapCellCompletModel> GetCells(int townId);
        void PatchMapCellItem(int townId, IEnumerable<MapCellItemModel> listCellItems);
        void PatchCellDig(int townId, IEnumerable<MapCellDigModel> cellDigsToUpdate);
        IEnumerable<MapCellDigCompletModel> GetCellsDigs(int townId);
        MapCellDigUpdateModel GetMapCellDigUpdate(int id, int days);
        IEnumerable<MapCellDigUpdateModel> GetMapUpdates(int townId);
        void InsertMapCellDigUpdate(MapCellDigUpdateModel mapCellDigUpdate);
        void PatchMapCellDig(List<MapCellDigModel> models);
        void DeleteMapCellDig(int idCell, int diggerId, int day);
        MapCellDigCompletModel GetCellDigs(int idCell, int idUser, int day);
        void ClearCellDig(IEnumerable<int> cellId);
        void ClearCellItem(int idCell, int idLastUpdateInfo);

        void UpdateEstimation(int townId, TownEstimationModel estimation);
        IEnumerable<TownEstimationModel> GetEstimations(int townId, int day);
    }
}
