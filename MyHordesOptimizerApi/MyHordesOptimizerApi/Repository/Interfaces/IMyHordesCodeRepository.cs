using MyHordesOptimizerApi.Data.Heroes;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Data.Ruins;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesCodeRepository
    {
        Dictionary<string, MyHordesRuinCodeModel> GetRuins();
        List<MyHordesCategoryCodeModel> GetCategories();
        Dictionary<string, List<string>> GetItemsProperties();
        Dictionary<string, List<string>> GetItemsActions();
        Dictionary<string, Dictionary<string, int>> GetItemsDropRates();
        List<MyHordesHerosCapacitiesCodeModel> GetHeroCapacities();
        Dictionary<string, MyHordesRecipeCodeModel> GetRecipes();
    }
}
