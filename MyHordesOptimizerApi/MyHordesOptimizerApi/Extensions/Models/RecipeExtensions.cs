using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Extensions.Models
{
    public static class RecipeExtensions
    {
        public static List<ItemRecipe> GetRecipeForItem(this List<ItemRecipe> recipes, int itemId)
        {
            return recipes.Where(r => r.Components.Any(comp => comp.Id == itemId) || r.Result.Any(result => result.Item.Id == itemId)).ToList();
        }
    }
}
