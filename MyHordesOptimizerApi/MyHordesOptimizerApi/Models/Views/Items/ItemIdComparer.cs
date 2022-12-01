using MyHordesOptimizerApi.Models.Views.Items.Citizen;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Items
{
    internal class ItemIdComparer : IEqualityComparer<ItemCompletModel>, IEqualityComparer<TownCitizenItemCompletModel>
    {
        public bool Equals([AllowNull] ItemCompletModel x, [AllowNull] ItemCompletModel y)
        {
            return x.IdItem == y.IdItem;
        }

        public bool Equals([AllowNull] TownCitizenItemCompletModel x, [AllowNull] TownCitizenItemCompletModel y)
        {
            return x.IdItem == y.IdItem;
        }

        public int GetHashCode([DisallowNull] ItemCompletModel obj)
        {
            return obj.IdItem.GetHashCode();
        }

        public int GetHashCode([DisallowNull] TownCitizenItemCompletModel obj)
        {
            return obj.IdItem.GetHashCode();
        }
    }
}