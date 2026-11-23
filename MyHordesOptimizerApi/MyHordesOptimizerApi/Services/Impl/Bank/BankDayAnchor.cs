using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Bank
{
    /// <summary>Ancre de datation : écart entre date de Paris et numéro de jour de jeu d'une ville.</summary>
    public static class BankDayAnchor
    {
        /// <summary>Écart le plus fréquent (égalité : le plus petit) ; null sans paire.</summary>
        public static int? ResolveOffset(IEnumerable<(DateTime UpdateUtc, int Day)> pairs)
        {
            return pairs
                .GroupBy(p => ParisCalendar.DateOf(p.UpdateUtc).DayNumber - p.Day)
                .OrderByDescending(g => g.Count())
                .ThenBy(g => g.Key)
                .Select(g => (int?)g.Key)
                .FirstOrDefault();
        }

        /// <summary>Jour de jeu d'un instant UTC pour l'écart donné.</summary>
        public static int DayOf(int offset, DateTime utc) => ParisCalendar.DateOf(utc).DayNumber - offset;
    }
}
