//using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
//using MyHordesOptimizerApi.Models;
//using System.Collections.Generic;

//namespace MyHordesOptimizerApi.Repository.Interfaces
//{
//    public interface IMyHordesOptimizerRepository
//    {
//        void PatchTown(Town town);
//        Town GetTown(int townId);
//        Town GetTownModel(int townId);

//        void PatchHeroSkill(IEnumerable<HeroSkill> heroSkills);
//        IEnumerable<HeroSkill> GetHeroSkills();

//        void PatchCauseOfDeath(IEnumerable<CauseOfDeath> causesOfDeath);
//        IEnumerable<CauseOfDeath> GetCausesOfDeath();

//        void PatchCleanUpType(IEnumerable<TownCadaverCleanUpType> causesOfDeath);
//        IEnumerable<TownCadaverCleanUpType> GetCleanUpTypes();

//        IEnumerable<TownCadaverCleanUp> GetCleanUps();


//        void PatchItems(IEnumerable<Item> items);
//        IEnumerable<Item> GetItems();

//        void PatchRecipes(IEnumerable<Recipe> recipes);
//        IEnumerable<Recipe> GetRecipes();
//        void DeleteAllRecipeComponents();
//        void DeleteAllRecipeResults();
//        void PatchRecipeComponents(string recipeName, IEnumerable<string> componentUids);
//        void PatchRecipeResults(IEnumerable<RecipeItemResult> results);

//        void PutBank(int townId, BankLastUpdateDto bank);
//        BankLastUpdateDto GetBank(int townId);

//        void PatchCitizen(int townId, CitizensLastUpdateDto citizens);
//        void PatchCitizenDetail(TownCitizen citizenDetail);
//        CitizensLastUpdateDto GetCitizens(int townId);
//        void UpdateCitizenLocation(int townId, int x, int y, IEnumerable<int> citizenId, int lastUpdateInfoId);

//        void PatchCadaver(int townId, CadaversLastUpdateDto cadavers);
//        CadaversLastUpdateDto GetCadavers(int townId);

//        void AddItemToWishlist(int townId, int itemId, int userId, int zoneXPa);
//        void PutWishList(int townId, int userId, IEnumerable<TownWishListItem> items);
//        WishListLastUpdateDto GetWishList(int townId);
//        void PatchWishlistCategories(List<WishlistCategorie> categories);
//        void PatchWishlistItemCategories(List<Item> itemsCategorie);
//        WishlistCategorie GetWishListCategories();
//        void PatchDefaultWishlistItems(List<DefaultWishlistItem> modeles);
//        IEnumerable<DefaultWishlistItem> GetWishListTemplate(int templateId);
//        IEnumerable<DefaultWishlistItem> GetWishListTemplates();

//        void PatchRuins(IEnumerable<MyHordesOptimizerRuinDto> jsonRuins);
//        IEnumerable<MyHordesOptimizerRuinDto> GetRuins();
//        IEnumerable<MyHordesOptimizerRuinDto> GetTownRuin(int value);

//        void PatchCategories(IEnumerable<Category> categories);
//        IEnumerable<Category> GetCategories();

//        void PatchProperties(IEnumerable<string> allProperties);
//        void DeleteAllPropertiesItem();
//        void PatchPropertiesItem(string itemUid, IEnumerable<string> properties);

//        void PatchActions(IEnumerable<string> allActions);
//        void DeleteAllActionsItem();
//        void PatchActionsItem(string itemUid, IEnumerable<string> actions);

//        void PatchCitizenBags(int townId, LastUpdateInfo lastUpdateInfo, IEnumerable<CitizenDto> citizens);
//        IDictionary<int, int> GetCitizenBagsId(int townId, IEnumerable<int> userIds);
//        int GetCitizenBagId(int townId, int userId);
//        IEnumerable<BagItem> GetAllBagItems(int townId);


//        int CreateLastUpdateInfo(LastUpdateInfo lastUpdateInfo);

//        IEnumerable<Parameter> GetParameters();
//        void PatchParameter(Parameter model);


//        void PatchMapCell(int townId, IEnumerable<MapCell> listCells, bool forceUpdate);
//        MapCell GetCell(int townId, int x, int y);
//        IEnumerable<MapCell> GetCells(int townId);
//        void PatchMapCellItem(int townId, IEnumerable<MapCellItem> listCellItems);
//        void PatchCellDig(int townId, IEnumerable<MapCellDig> cellDigsToUpdate);
//        IEnumerable<MapCellDig> GetCellsDigs(int townId);
//        MapCellDig GetMapCellDigUpdate(int id, int days);
//        IEnumerable<MapCellDig> GetMapUpdates(int townId);
//        void InsertMapCellDigUpdate(MapCellDigUpdate mapCellDigUpdate);
//        void PatchMapCellDig(List<MapCellDig> models);
//        void DeleteMapCellDig(int idCell, int diggerId, int day);
//        MapCellDig GetCellDigs(int idCell, int idUser, int day);
//        void ClearCellDig(IEnumerable<int> cellId);
//        void ClearCellItem(int idCell, int idLastUpdateInfo);

//        void UpdateEstimation(int townId, TownEstimation estimation);
//        IEnumerable<TownEstimation> GetEstimations(int townId, int day);

//        Expedition InsertExpedition(Expedition expeditionModel);
//    }
//}
