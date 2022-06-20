using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Recipes
{
    internal class RecipeNameComparer : IEqualityComparer<RecipeCompletModel>
    {
        public bool Equals([AllowNull] RecipeCompletModel x, [AllowNull] RecipeCompletModel y)
        {
            return x.RecipeName == y.RecipeName;
        }

        public int GetHashCode([DisallowNull] RecipeCompletModel obj)
        {
            return obj.RecipeName.GetHashCode();
        }
    }
}
