using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Map
{
    public class CellIdComparer : IEqualityComparer<MapCellCompletModel>
    {
        public bool Equals([AllowNull] MapCellCompletModel x, [AllowNull] MapCellCompletModel y)
        {
            return x.IdCell == y.IdCell;
        }

        public int GetHashCode([DisallowNull] MapCellCompletModel obj)
        {
            return HashCode.Combine(obj.IdCell);
        }
    }
}
