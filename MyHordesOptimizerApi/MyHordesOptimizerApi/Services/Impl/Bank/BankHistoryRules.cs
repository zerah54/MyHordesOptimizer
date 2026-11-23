using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.Services.Impl.Bank
{
    /// <summary>Ligne normalisée de la banque (sans valeur nulle).</summary>
    public sealed record BankLine(int IdItem, bool IsBroken, int Count);

    /// <summary>Référence d'une version enregistrée de la banque.</summary>
    public sealed record SnapshotRef(int IdLastUpdateInfo, int Day, string ContentHash);

    /// <summary>Règles pures de l'historique de la banque.</summary>
    public static class BankHistoryRules
    {
        /// <summary>Dédoublonne sur (IdItem, IsBroken) en gardant la première ligne ; null devient false / 0.</summary>
        public static IReadOnlyList<BankLine> Normalize(IEnumerable<TownBankItem> items)
        {
            return items
                .GroupBy(i => (i.IdItem, IsBroken: i.IsBroken ?? false))
                .Select(g => g.First())
                .Select(i => new BankLine(i.IdItem, i.IsBroken ?? false, i.Count ?? 0))
                .ToList();
        }

        /// <summary>Empreinte SHA-256 hexadécimale minuscule, indépendante de l'ordre des lignes.</summary>
        public static string Fingerprint(IReadOnlyCollection<BankLine> lines)
        {
            var canonical = string.Join(";", lines
                .OrderBy(l => l.IdItem).ThenBy(l => l.IsBroken)
                .Select(l => $"{l.IdItem}:{(l.IsBroken ? 1 : 0)}:{l.Count}"));
            return System.Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();
        }

        /// <summary>Vrai sauf si la dernière version a le même contenu le même jour.</summary>
        public static bool ShouldRecord(SnapshotRef? latest, string hash, int day)
        {
            return latest is null || latest.ContentHash != hash || latest.Day != day;
        }

        /// <summary>Ids des versions des jours écoulés (&lt; day) qui ne sont pas la dernière de leur jour.</summary>
        public static IReadOnlyList<int> SnapshotsToPurge(IReadOnlyCollection<SnapshotRef> existing, int day)
        {
            return existing
                .Where(s => s.Day < day)
                .GroupBy(s => s.Day)
                .SelectMany(g => g.OrderByDescending(s => s.IdLastUpdateInfo).Skip(1))
                .Select(s => s.IdLastUpdateInfo)
                .ToList();
        }

        /// <summary>Dernière version de chaque jour écoulé, toutes celles du jour en cours (max du jour de la ville et des versions), triées par id croissant.</summary>
        public static IReadOnlyList<SnapshotRef> VisibleVersions(IReadOnlyCollection<SnapshotRef> existing, int townDay)
        {
            if (existing.Count == 0)
            {
                return new List<SnapshotRef>();
            }
            var currentDay = System.Math.Max(townDay, existing.Max(s => s.Day));
            return existing
                .GroupBy(s => s.Day)
                .SelectMany(g => g.Key == currentDay ? g.ToList() : new List<SnapshotRef> { g.OrderByDescending(s => s.IdLastUpdateInfo).First() })
                .OrderBy(s => s.IdLastUpdateInfo)
                .ToList();
        }
    }
}
