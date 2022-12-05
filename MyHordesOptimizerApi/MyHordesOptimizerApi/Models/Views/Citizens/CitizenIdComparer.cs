using MyHordesOptimizerApi.Models.Views.Items;
using MyHordesOptimizerApi.Models.Views.Items.Citizen;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Citizens
{
    public class CitizenIdComparer : IEqualityComparer<TownCitizenBagItemCompletModel>
    {
        public bool Equals([AllowNull] TownCitizenBagItemCompletModel x, [AllowNull] TownCitizenBagItemCompletModel y)
        {
            return x.CitizenId == y.CitizenId;
        }

        public int GetHashCode([DisallowNull] TownCitizenBagItemCompletModel obj)
        {
            return obj.CitizenId.GetHashCode();
        }
    }
}
