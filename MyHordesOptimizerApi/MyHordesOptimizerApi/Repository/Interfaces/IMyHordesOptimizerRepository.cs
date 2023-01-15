﻿using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
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

        void PatchHeroSkill(List<HeroSkillsModel> heroSkills);
        List<HeroSkill> GetHeroSkills();

        void PatchItems(List<ItemModel> items);
        List<Item> GetItems();

        void PatchRecipes(List<RecipeModel> recipes);
        List<ItemRecipe> GetRecipes();
        void DeleteAllRecipeComponents();
        void DeleteAllRecipeResults();
        void PatchRecipeComponents(string recipeName, List<string> componentUids);
        void PatchRecipeResults(List<RecipeItemResultModel> results);

        void PutBank(int townId, BankWrapper bank);
        BankWrapper GetBank(int townId);

        void PatchCitizen(int townId, CitizensWrapper citizens);
        void PatchCitizenDetail(TownCitizenDetailModel citizenDetail);
        CitizensWrapper GetCitizens(int townId);
        void UpdateCitizenLocation(int townId, int x, int y, List<int> citizenId);


        void AddItemToWishlist(int townId, int itemId, int userId);
        void PutWishList(int townId, int userId, List<TownWishlistItemModel> items);
        WishListWrapper GetWishList(int townId);

        void PatchRuins(List<MyHordesOptimizerRuin> jsonRuins);
        List<MyHordesOptimizerRuin> GetRuins();

        void PatchCategories(List<CategoryModel> categories);
        IEnumerable<CategoryModel> GetCategories();

        void PatchProperties(List<string> allProperties);
        void DeleteAllPropertiesItem();
        void PatchPropertiesItem(string itemUid, List<string> properties);

        void PatchActions(List<string> allActions);
        void DeleteAllActionsItem();
        void PatchActionsItem(string itemUid, List<string> actions);

        void PatchCitizenBags(int townId, LastUpdateInfo lastUpdateInfo, List<Citizen> citizens);
        IDictionary<int,int> GetCitizenBagsId(int townId, IEnumerable<int> userIds);
        int GetCitizenBagId(int townId, int userId);
        int CreateLastUpdateInfo(LastUpdateInfo lastUpdateInfo);

        IEnumerable<ParametersModel> GetParameters();
        void PatchParameter(ParametersModel model);


        void PatchMapCell(int townId, List<MapCellModel> listCells);
        MapCellCompletModel GetCell(int townId, int zoneItemX, int zoneItemY);
        IEnumerable<MapCellCompletModel> GetCells(int townId);
        void PatchMapCellItem(int townId, List<MapCellItemModel> listCellItems);
    }
}
