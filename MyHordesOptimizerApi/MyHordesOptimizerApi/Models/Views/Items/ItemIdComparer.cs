using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Items
{
    internal class ItemIdComparer : IEqualityComparer<ItemCompletModel>
    {
        public bool Equals([AllowNull] ItemCompletModel x, [AllowNull] ItemCompletModel y)
        {
            return x.IdItem == y.IdItem;
        }

        public int GetHashCode([DisallowNull] ItemCompletModel obj)
        {
            return obj.IdItem.GetHashCode();
        }
    }
}