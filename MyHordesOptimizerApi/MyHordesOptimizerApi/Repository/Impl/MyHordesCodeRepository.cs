using MyHordesOptimizerApi.Data.Heroes;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Data.Ruins;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Repository.Interfaces;
using System.Collections.Generic;
using System.IO;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class MyHordesCodeRepository : IMyHordesCodeRepository
    {
        public Dictionary<string, MyHordesRuinCodeModel> GetRuins()
        {
            var path = "Data/Ruins/ruins.json";
            var json = File.ReadAllText(path);
            var dico = json.FromJson<Dictionary<string, MyHordesRuinCodeModel>>();
            return dico;
        }

        public List<MyHordesCategoryCodeModel> GetCategories()
        {
            var path = "Data/Items/categories.json";
            var json = File.ReadAllText(path);
            var list = json.FromJson<List<MyHordesCategoryCodeModel>>();
            return list;
        }

        public Dictionary<string, List<string>> GetItemsProperties()
        {
            var path = "Data/Items/item-properties.json";
            var json = File.ReadAllText(path);
            var dico = json.FromJson<Dictionary<string, List<string>>>();
            return dico;
        }

        public Dictionary<string, List<string>> GetItemsActions()
        {
            var path = "Data/Items/item-actions.json";
            var json = File.ReadAllText(path);
            var dico = json.FromJson<Dictionary<string, List<string>>>();
            return dico;
        }

        public Dictionary<string, List<MyHordesItemDropCodeModel>> GetItemsDropRates()
        {
            var path = "Data/Items/find.json";
            var json = File.ReadAllText(path);
            var dico = json.FromJson<Dictionary<string, List<MyHordesItemDropCodeModel>>>();
            return dico;
        }

        public List<MyHordesHerosCapacitiesCodeModel> GetHeroCapacities()
        {
            var path = "Data/Heroes/capacities.json";
            var json = File.ReadAllText(path);
            var list = json.FromJson<List<MyHordesHerosCapacitiesCodeModel>>();
            return list;
        }

        public Dictionary<string, MyHordesRecipeCodeModel> GetRecipes()
        {
            var path = "Data/Items/recipes.json";
            var json = File.ReadAllText(path);
            var dico = json.FromJson<Dictionary<string, MyHordesRecipeCodeModel>>();
            return dico;
        }
    }
}
