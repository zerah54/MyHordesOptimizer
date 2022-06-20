using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Ruins
{
    internal class RuinIdComparer : IEqualityComparer<RuinCompletModel>
    {
        public bool Equals([AllowNull] RuinCompletModel x, [AllowNull] RuinCompletModel y)
        {
            return x.IdRuin == y.IdRuin;
        }

        public int GetHashCode([DisallowNull] RuinCompletModel obj)
        {
            return obj.IdRuin.GetHashCode();
        }
    }
}
