using MyHordesOptimizerApi.Data.CauseOfDeath;
using MyHordesOptimizerApi.Data.Heroes;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Data.Ruins;
using MyHordesOptimizerApi.Data.Wishlist;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Repository.Interfaces;
using System.Collections.Generic;
using System.IO;
using MyHordesOptimizerApi.Data.Camping;
using Newtonsoft.Json.Linq;
using System.Linq;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class MyHordesCodeRepository : IMyHordesCodeRepository
    {
        public Dictionary<string, MyHordesRuinCodeModel> GetRuins()
        {
            var path = "Data/Ruins/ruins.json";
            var text = File.ReadAllText(path);
            var json = JObject.Parse(text);

            var path2 = "Data/Ruins/ruins_additional_info.json";
            var text2 = File.ReadAllText(path2);
            var json2 = JObject.Parse(text2);

            var jsonFinal = new JObject();
            jsonFinal.Merge(json);
            jsonFinal.Merge(json2);

            var dico = jsonFinal.ToJson().FromJson<Dictionary<string, MyHordesRuinCodeModel>>();
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

        public Dictionary<string, Dictionary<string, dynamic[]>> GetItemsDropRates()
        {
            var path = "Data/Items/find.json";
            var json = File.ReadAllText(path);
            var dico = json.FromJson<Dictionary<string, Dictionary<string, dynamic[]>>>();
            return dico;
        }

        public List<MyHordesHerosCapacitiesCodeModel> GetHeroCapacities()
        {
            var capacitiesPath = "Data/Heroes/capacities.json";
            var capacitiesJson = File.ReadAllText(capacitiesPath);
            var capacitiesDictionnary = capacitiesJson.FromJson<Dictionary<string, MyHordesHerosCapacitiesCodeModel>>();

            var powerPath = "Data/Heroes/powers.json";
            var powerJson = File.ReadAllText(powerPath);
            var powerDictionnary = powerJson.FromJson<Dictionary<string, MyHordesHerosCapacitiesCodeModel>>();
            powerDictionnary = powerDictionnary.Where(powerKeyValue => capacitiesDictionnary.Values.Any(capacity => capacity.Action != powerKeyValue.Key))
                .ToDictionary();
            
            foreach(var power in powerDictionnary)
            {
                capacitiesDictionnary.Add(power.Key, power.Value);
            }

            return capacitiesDictionnary.Values.ToList();
        }

        public List<MyHordesCauseOfDeathModel> GetCausesOfDeath()
        {
            var path = "Data/CauseOfDeath/cause-of-death.json";
            var json = File.ReadAllText(path);
            var list = json.FromJson<List<MyHordesCauseOfDeathModel>>();
            return list;
        }

        public List<MyHordesCleanUpTypeModel> GetCleanUpTypes()
        {
            var path = "Data/CauseOfDeath/clean-up-type.json";
            var json = File.ReadAllText(path);
            var list = json.FromJson<List<MyHordesCleanUpTypeModel>>();
            return list;
        }

        public Dictionary<string, MyHordesRecipeCodeModel> GetRecipes()
        {
            var path = "Data/Items/recipes.json";
            var json = File.ReadAllText(path);
            var dico = json.FromJson<Dictionary<string, MyHordesRecipeCodeModel>>();
            return dico;
        }

        public List<MyHordesOptimizerWishlistItemCategorie> GetWishlistItemCategories()
        {
            var path = "Data/Wishlist/WishlistItemCategories.json";
            var json = File.ReadAllText(path);
            var list = json.FromJson<List<MyHordesOptimizerWishlistItemCategorie>>();
            return list;
        }

        public List<MyHordesOptimizerDefaultWishlist> GetDefaultWishlists()
        {
            var path = "Data/Wishlist/DefaultWishlist.json";
            var json = File.ReadAllText(path);
            var list = json.FromJson<List<MyHordesOptimizerDefaultWishlist>>();
            return list;
        }

        public MyHordesCampingBonusModel GetCampingBonus()
        {
            var path = "Data/Camping/CampingBonus.json";
            var json = File.ReadAllText(path);
            var dico = json.FromJson<MyHordesCampingBonusModel>();
            return dico;
        }

        public List<MyHordesCampingResultModel> GetCampingResults()
        {
            var path = "Data/Camping/CampingResult.json";
            var json = File.ReadAllText(path);
            var list = json.FromJson<List<MyHordesCampingResultModel>>();
            return list;
        }
    }
}
