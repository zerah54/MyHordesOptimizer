using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Bank
{
    /// <summary>Photo de banque existante d'une ville.</summary>
    public sealed record ExistingPhoto(int IdLastUpdateInfo, DateTime UpdateUtc, string ContentHash);

    /// <summary>Décision de reprise : <c>Day == null</c> signifie photo à supprimer.</summary>
    public sealed record BackfillDecision(int IdLastUpdateInfo, int? Day);

    /// <summary>Planification de la reprise des photos de banque existantes d'une ville.</summary>
    public static class BankBackfillPlanner
    {
        private static readonly TimeSpan RecentThreshold = TimeSpan.FromHours(24);

        /// <summary>Décide, par photo, du jour de jeu de rattachement ou de la suppression.</summary>
        public static IReadOnlyList<BackfillDecision> PlanTown(IReadOnlyList<ExistingPhoto> photos, int? offset, int townDay, DateTime nowUtc)
        {
            var ordered = photos.OrderBy(p => p.IdLastUpdateInfo).ToList();
            if (ordered.Count == 0)
            {
                return new List<BackfillDecision>();
            }

            if (offset is null)
            {
                var latest = ordered[^1];
                if (nowUtc - latest.UpdateUtc >= RecentThreshold)
                {
                    return ordered
                        .Select(p => new BackfillDecision(p.IdLastUpdateInfo, p == latest ? townDay : null))
                        .ToList();
                }
                offset = ParisCalendar.DateOf(latest.UpdateUtc).DayNumber - townDay;
            }

            var days = ordered
                .Select(p => (Photo: p, Day: Math.Clamp(BankDayAnchor.DayOf(offset.Value, p.UpdateUtc), 1, townDay)))
                .ToList();

            var lastIdOfDay = days
                .Where(d => d.Day < townDay)
                .GroupBy(d => d.Day)
                .ToDictionary(g => g.Key, g => g.Max(d => d.Photo.IdLastUpdateInfo));

            var decisions = new List<BackfillDecision>();
            string? previousKeptHash = null;
            foreach (var (photo, day) in days)
            {
                bool keep;
                if (day < townDay)
                {
                    keep = lastIdOfDay[day] == photo.IdLastUpdateInfo;
                }
                else
                {
                    keep = photo.ContentHash != previousKeptHash;
                    if (keep)
                    {
                        previousKeptHash = photo.ContentHash;
                    }
                }
                decisions.Add(new BackfillDecision(photo.IdLastUpdateInfo, keep ? day : null));
            }
            return decisions;
        }
    }
}
