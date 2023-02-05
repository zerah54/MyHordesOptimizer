using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Map
{
    public class CellModelComparer : IEqualityComparer<MapCellModel>
    {
        public bool Equals([AllowNull] MapCellModel x, [AllowNull] MapCellModel y)
        {
            return x.AveragePotentialRemainingDig == y.AveragePotentialRemainingDig
                 && x.DangerLevel == y.DangerLevel
                 && x.IdCell == y.IdCell
                 && x.IdRuin == y.IdRuin
                 && x.IdTown == y.IdTown
                 && x.IsDryed == y.IsDryed
                 && x.IsNeverVisited == y.IsNeverVisited
                 && x.IsRuinCamped == y.IsRuinCamped
                 && x.IsRuinDryed == y.IsRuinDryed
                 && x.IsTown == y.IsTown
                 && x.IsVisitedToday == y.IsVisitedToday
                 && x.MaxPotentialRemainingDig == y.MaxPotentialRemainingDig
                 && x.NbHero == y.NbHero
                 && x.NbKm == y.NbKm
                 && x.NbPa == y.NbPa
                 && x.NbRuinDig == y.NbRuinDig
                 && x.NbZombie == y.NbZombie
                 && x.NbZombieKilled == y.NbZombieKilled
                 && x.X == y.X
                 && x.Y == y.Y
                 && x.ZoneRegen == y.ZoneRegen;
        }

        public int GetHashCode([DisallowNull] MapCellModel obj)
        {
            var hash = new HashCode();
            hash.Add(obj.AveragePotentialRemainingDig);
            hash.Add(obj.DangerLevel);
            hash.Add(obj.IdCell);
            hash.Add(obj.IdRuin);
            hash.Add(obj.IdTown);
            hash.Add(obj.IsDryed);
            hash.Add(obj.IsNeverVisited);
            hash.Add(obj.IsRuinCamped);
            hash.Add(obj.IsRuinDryed);
            hash.Add(obj.IsTown);
            hash.Add(obj.IsVisitedToday);
            hash.Add(obj.MaxPotentialRemainingDig);
            hash.Add(obj.NbHero);
            hash.Add(obj.NbKm);
            hash.Add(obj.NbPa);
            hash.Add(obj.NbRuinDig);
            hash.Add(obj.NbZombie);
            hash.Add(obj.NbZombieKilled);
            hash.Add(obj.X);
            hash.Add(obj.Y);
            hash.Add(obj.ZoneRegen);

            return hash.ToHashCode();
        }
    }
}
