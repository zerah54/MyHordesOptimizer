using MyHordesOptimizerApi.Data.CauseOfDeath;
using MyHordesOptimizerApi.Data.Heroes;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Data.Ruins;
using MyHordesOptimizerApi.Data.Wishlist;
using System.Collections.Generic;
using MyHordesOptimizerApi.Data.Camping;
using MyHordesOptimizerApi.Data.Building;
using MyHordesOptimizerApi.Data.Jobs;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesCodeRepository
    {
        Dictionary<string, MyHordesRuinCodeModel> GetRuins();
        List<MyHordesCategoryCodeModel> GetCategories();
        Dictionary<string, List<string>> GetItemsProperties();
        Dictionary<string, List<string>> GetItemsActions();
        Dictionary<string, Dictionary<string, dynamic[]>> GetItemsDropRates();
        List<MyHordesHerosCapacitiesCodeModel> GetHeroCapacities();
        List<MyHordesCauseOfDeathModel> GetCausesOfDeath();
        List<MyHordesCleanUpTypeModel> GetCleanUpTypes();
        Dictionary<string, MyHordesRecipeCodeModel> GetRecipes();
        List<MyHordesOptimizerWishlistItemCategorie> GetWishlistItemCategories();
        List<MyHordesOptimizerDefaultWishlist> GetDefaultWishlists();
        MyHordesCampingBonusModel GetCampingBonus();
        List<MyHordesCampingResultModel> GetCampingResults();
        Dictionary<string, BuildingCodeModel> GetBuildings();
        Dictionary<string, JobCodeModel> GetJobs();
    }
}
