using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Items.Citizen
{
    public class TownCitizenItemComparer : IEqualityComparer<TownCitizenItemCompletModel>
    {
        public bool Equals([AllowNull] TownCitizenItemCompletModel x, [AllowNull] TownCitizenItemCompletModel y)
        {
            return x.IdItem == y.IdItem && x.CitizenId == y.CitizenId && x.TownId == y.TownId;
        }

        public int GetHashCode([DisallowNull] TownCitizenItemCompletModel obj)
        {
            return HashCode.Combine(obj.IdItem, obj.CitizenId, obj.TownId);
        }
    }
}
