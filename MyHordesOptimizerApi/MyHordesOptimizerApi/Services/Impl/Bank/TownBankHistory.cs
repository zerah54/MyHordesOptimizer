using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.Services.Impl.Bank
{
    /// <summary>Point d'écriture et lectures de l'historique de la banque d'une ville.</summary>
    public static class TownBankHistory
    {
        /// <summary>
        /// Ajoute au contexte une nouvelle version si le contenu ou le jour a changé, et purge au passage
        /// les versions des jours écoulés. Pas de SaveChanges : l'appelant le fait dans sa transaction.
        /// </summary>
        /// <returns>Vrai si une version est ajoutée.</returns>
        public static bool Record(MhoContext db, int townId, int day, int idLastUpdateInfo, IEnumerable<TownBankItem> items)
        {
            var lines = BankHistoryRules.Normalize(items);
            var hash = BankHistoryRules.Fingerprint(lines);
            var existing = ReadHeaders(db, townId);
            var latest = existing.OrderByDescending(s => s.IdLastUpdateInfo).FirstOrDefault();
            if (!BankHistoryRules.ShouldRecord(latest, hash, day))
            {
                return false;
            }

            if (latest is not null && day > latest.Day)
            {
                var purged = BankHistoryRules.SnapshotsToPurge(existing, day);
                if (purged.Count > 0)
                {
                    db.TownBankItems.Where(i => i.IdTown == townId && purged.Contains(i.IdLastUpdateInfo)).ExecuteDelete();
                    db.TownBankSnapshots.Where(s => s.IdTown == townId && purged.Contains(s.IdLastUpdateInfo)).ExecuteDelete();
                }
            }

            db.TownBankSnapshots.Add(new TownBankSnapshot { IdTown = townId, IdLastUpdateInfo = idLastUpdateInfo, Day = day, ContentHash = hash });
            db.TownBankItems.AddRange(lines.Select(l => new TownBankItem
            {
                IdTown = townId,
                IdLastUpdateInfo = idLastUpdateInfo,
                IdItem = l.IdItem,
                IsBroken = l.IsBroken,
                Count = l.Count
            }));
            return true;
        }

        /// <summary>Id de la version la plus récente (plus grand idLastUpdateInfo) ; sans aucun en-tête (reprise pas encore passée), la dernière photo ; sinon null.</summary>
        public static int? LatestSnapshotId(MhoContext db, int townId)
        {
            return db.TownBankSnapshots.Where(s => s.IdTown == townId).Max(s => (int?)s.IdLastUpdateInfo)
                ?? db.TownBankItems.Where(i => i.IdTown == townId).Max(i => (int?)i.IdLastUpdateInfo);
        }

        /// <summary>Versions visibles de la ville au jour actuel de la ville, triées par id croissant.</summary>
        public static IReadOnlyList<SnapshotRef> VisibleVersions(MhoContext db, int townId)
        {
            var townDay = db.Towns.Where(t => t.IdTown == townId).Select(t => t.Day).FirstOrDefault();
            return BankHistoryRules.VisibleVersions(ReadHeaders(db, townId), townDay);
        }

        private static List<SnapshotRef> ReadHeaders(MhoContext db, int townId)
        {
            return db.TownBankSnapshots.AsNoTracking()
                .Where(s => s.IdTown == townId)
                .Select(s => new SnapshotRef(s.IdLastUpdateInfo, s.Day, s.ContentHash))
                .ToList();
        }
    }
}
