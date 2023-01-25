using MyHordesOptimizerApi.Models.Map;
using MyHordesOptimizerApi.Models.Views.Items.Citizen;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Citizens
{
    public class CitizenIdComparer : IEqualityComparer<TownCitizenBagItemCompletModel>, IEqualityComparer<MapCellCompletModel>
    {
        public bool Equals([AllowNull] TownCitizenBagItemCompletModel x, [AllowNull] TownCitizenBagItemCompletModel y)
        {
            return x.CitizenId == y.CitizenId;
        }

        public bool Equals([AllowNull] MapCellCompletModel x, [AllowNull] MapCellCompletModel y)
        {
            return x.CitizenId == y.CitizenId;
        }

        public int GetHashCode([DisallowNull] TownCitizenBagItemCompletModel obj)
        {
            return obj.CitizenId.GetHashCode();
        }

        public int GetHashCode([DisallowNull] MapCellCompletModel obj)
        {
            return obj.CitizenId.GetHashCode();
        }
    }
}
