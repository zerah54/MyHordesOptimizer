using MyHordesOptimizerApi.Models.Map;
using MyHordesOptimizerApi.Models.Views.Items.Citizen;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Items
{
    internal class ItemIdComparer : IEqualityComparer<ItemCompletModel>, IEqualityComparer<TownCitizenBagItemCompletModel>, IEqualityComparer<MapCellCompletModel>
    {
        public bool Equals([AllowNull] ItemCompletModel x, [AllowNull] ItemCompletModel y)
        {
            return x.IdItem == y.IdItem;
        }

        public bool Equals([AllowNull] TownCitizenBagItemCompletModel x, [AllowNull] TownCitizenBagItemCompletModel y)
        {
            return x.IdItem == y.IdItem;
        }

        public bool Equals([AllowNull] MapCellCompletModel x, [AllowNull] MapCellCompletModel y)
        {
            return x.ItemId == y.ItemId;
        }

        public int GetHashCode([DisallowNull] ItemCompletModel obj)
        {
            return obj.IdItem.GetHashCode();
        }

        public int GetHashCode([DisallowNull] TownCitizenBagItemCompletModel obj)
        {
            return obj.IdItem.GetHashCode();
        }

        public int GetHashCode([DisallowNull] MapCellCompletModel obj)
        {
            return obj.ItemId.GetHashCode();
        }
    }
}