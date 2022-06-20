﻿using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesOptimizerRepository
    {
        void PatchTown(Town town);
        Town GetTown(int townId);

        void PatchHeroSkill(List<HeroSkillsModel> heroSkills);
        List<HeroSkill> GetHeroSkills();

        void PatchItems(List<ItemModel> items);
        List<Item> GetItems();
        Item GetItemsById(int itemId);

        void PatchRecipes(List<RecipeModel> recipes);
        List<ItemRecipe> GetRecipes();
        void DeleteAllRecipeComponents();
        void DeleteAllRecipeResults();
        void PatchRecipeComponents(string recipeName, List<string> componentUids);
        void PatchRecipeResults(List<RecipeItemResultModel> results);

        void PutBank(int townId, BankWrapper bank);

        void PatchCitizen(int townId, CitizensWrapper citizens);

        void PutWishList(int townId, WishListWrapper wishList);

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
    }
}
