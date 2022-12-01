using MyHordesOptimizerApi.Models.Views.Items;
using MyHordesOptimizerApi.Models.Views.Items.Citizen;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Citizens
{
    public class CitizenIdComparer : IEqualityComparer<TownCitizenItemCompletModel>
    {
        public bool Equals([AllowNull] TownCitizenItemCompletModel x, [AllowNull] TownCitizenItemCompletModel y)
        {
            return x.CitizenId == y.CitizenId;
        }

        public int GetHashCode([DisallowNull] TownCitizenItemCompletModel obj)
        {
            return obj.CitizenId.GetHashCode();
        }
    }
}
