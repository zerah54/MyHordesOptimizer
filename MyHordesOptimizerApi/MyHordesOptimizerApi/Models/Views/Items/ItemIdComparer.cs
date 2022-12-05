using MyHordesOptimizerApi.Models.Views.Items.Citizen;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Items
{
    internal class ItemIdComparer : IEqualityComparer<ItemCompletModel>, IEqualityComparer<TownCitizenBagItemCompletModel>
    {
        public bool Equals([AllowNull] ItemCompletModel x, [AllowNull] ItemCompletModel y)
        {
            return x.IdItem == y.IdItem;
        }

        public bool Equals([AllowNull] TownCitizenBagItemCompletModel x, [AllowNull] TownCitizenBagItemCompletModel y)
        {
            return x.IdItem == y.IdItem;
        }

        public int GetHashCode([DisallowNull] ItemCompletModel obj)
        {
            return obj.IdItem.GetHashCode();
        }

        public int GetHashCode([DisallowNull] TownCitizenBagItemCompletModel obj)
        {
            return obj.IdItem.GetHashCode();
        }
    }
}