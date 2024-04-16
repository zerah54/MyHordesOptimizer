using MyHordesOptimizerApi.Models;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Comparer
{
    public class MapCellEqualityComaprer : IEqualityComparer<MapCell>
    {
        public bool Equals(MapCell? x, MapCell? y)
        {
            var equals = x.AveragePotentialRemainingDig == y.AveragePotentialRemainingDig
                 && x.DangerLevel == y.DangerLevel
                 && x.IdRuin == y.IdRuin
                 && x.IsDryed == y.IsDryed
                 && x.IsNeverVisited == y.IsNeverVisited
                 && x.MaxPotentialRemainingDig == y.MaxPotentialRemainingDig
                 && x.NbHero == y.NbHero
                 && x.NbRuinDig == y.NbRuinDig
                 && x.NbZombie == y.NbZombie
                 && x.NbZombieKilled == y.NbZombieKilled
                 && x.Note == y.Note
                 && x.ZoneRegen == y.ZoneRegen
                 && x.X == y.X
                 && x.Y == y.Y
                 && x.IdTown == y.IdTown;
            return equals;
        }

        public int GetHashCode([DisallowNull] MapCell obj)
        {
            return obj.IdCell.GetHashCode();
        }
    }
}
