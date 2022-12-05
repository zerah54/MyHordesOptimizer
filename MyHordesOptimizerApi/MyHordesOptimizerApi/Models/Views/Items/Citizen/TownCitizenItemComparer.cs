using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Items.Citizen
{
    public class TownCitizenItemComparer : IEqualityComparer<TownCitizenBagItemCompletModel>
    {
        public bool Equals([AllowNull] TownCitizenBagItemCompletModel x, [AllowNull] TownCitizenBagItemCompletModel y)
        {
            return x.IdItem == y.IdItem && x.CitizenId == y.CitizenId && x.TownId == y.TownId;
        }

        public int GetHashCode([DisallowNull] TownCitizenBagItemCompletModel obj)
        {
            return HashCode.Combine(obj.IdItem, obj.CitizenId, obj.TownId);
        }
    }
}
