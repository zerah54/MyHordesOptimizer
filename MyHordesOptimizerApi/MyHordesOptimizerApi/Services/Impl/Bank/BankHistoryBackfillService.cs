using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Import;

namespace MyHordesOptimizerApi.Services.Impl.Bank
{
    /// <summary>Reprise unique : date les photos de banque sans en-tête et supprime celles que la règle ne garde pas.</summary>
    public class BankHistoryBackfillService
    {
        private readonly MhoContext _db;
        private readonly ILogger<BankHistoryBackfillService> _logger;

        public BankHistoryBackfillService(MhoContext db, ILogger<BankHistoryBackfillService> logger)
        {
            _db = db;
            _logger = logger;
        }

        /// <summary>
        /// Traite chaque ville ayant des photos sans en-tête, une transaction par ville ; une erreur n'arrête pas les autres.
        /// <paramref name="onlyTownIds"/> limite la reprise à ces villes (null = toute la base).
        /// </summary>
        public async Task RunAsync(Action<ImportStepProgress> onStep, IReadOnlyCollection<int>? onlyTownIds = null)
        {
            // La suppression de la plus grosse ville (~650 000 lignes) dépasse largement les 30 s par défaut.
            _db.Database.SetCommandTimeout(TimeSpan.FromMinutes(30));
            var candidates = _db.TownBankItems.AsNoTracking()
                .Where(i => !_db.TownBankSnapshots.Any(s => s.IdTown == i.IdTown && s.IdLastUpdateInfo == i.IdLastUpdateInfo));
            if (onlyTownIds is not null)
            {
                candidates = candidates.Where(i => onlyTownIds.Contains(i.IdTown));
            }
            List<int> townIds;
            try
            {
                townIds = await candidates.Select(i => i.IdTown).Distinct().OrderBy(id => id).ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Reprise de l'historique de banque : lecture des villes à traiter en échec");
                onStep(new ImportStepProgress("town", 0, 0, "Lecture des villes à traiter en échec"));
                return;
            }

            var failures = 0;
            for (var index = 0; index < townIds.Count; index++)
            {
                onStep(new ImportStepProgress("town", index + 1, townIds.Count));
                try
                {
                    await BackfillTownAsync(townIds[index]);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Reprise de l'historique de banque en échec pour la ville {TownId}", townIds[index]);
                    failures++;
                    onStep(new ImportStepProgress("town", index + 1, townIds.Count, $"{failures} ville(s) en échec, dernière : {townIds[index]}"));
                }
                finally
                {
                    _db.ChangeTracker.Clear();
                }
            }
        }

        private async Task BackfillTownAsync(int townId)
        {
            var headerIds = _db.TownBankSnapshots.Where(s => s.IdTown == townId).Select(s => s.IdLastUpdateInfo);
            var lines = await _db.TownBankItems.AsNoTracking()
                .Where(i => i.IdTown == townId && !headerIds.Contains(i.IdLastUpdateInfo))
                .ToListAsync();
            if (lines.Count == 0)
            {
                return;
            }

            var dates = await _db.TownBankItems.AsNoTracking()
                .Where(i => i.IdTown == townId && !headerIds.Contains(i.IdLastUpdateInfo))
                .Select(i => i.IdLastUpdateInfo).Distinct()
                .Join(_db.LastUpdateInfos, id => id, l => l.IdLastUpdateInfo, (id, l) => new { Id = id, l.DateUpdate })
                .ToDictionaryAsync(x => x.Id, x => x.DateUpdate);

            var photos = lines.GroupBy(l => l.IdLastUpdateInfo)
                .Select(g => new ExistingPhoto(g.Key, dates[g.Key], BankHistoryRules.Fingerprint(BankHistoryRules.Normalize(g))))
                .ToList();

            var pairs = await ReadDayPairsAsync(townId);
            var townDay = Math.Max(await _db.Towns.Where(t => t.IdTown == townId).Select(t => t.Day).SingleAsync(), 1);
            var decisions = BankBackfillPlanner.PlanTown(photos, BankDayAnchor.ResolveOffset(pairs), townDay, DateTime.UtcNow);

            var hashes = photos.ToDictionary(p => p.IdLastUpdateInfo, p => p.ContentHash);
            var toDelete = decisions.Where(d => d.Day is null).Select(d => d.IdLastUpdateInfo).ToList();

            await using var tx = await _db.Database.BeginTransactionAsync();
            _db.TownBankSnapshots.AddRange(decisions.Where(d => d.Day is not null).Select(d => new TownBankSnapshot
            {
                IdTown = townId,
                IdLastUpdateInfo = d.IdLastUpdateInfo,
                Day = d.Day!.Value,
                ContentHash = hashes[d.IdLastUpdateInfo]
            }));
            await _db.SaveChangesAsync();
            if (toDelete.Count > 0)
            {
                await _db.TownBankItems.Where(i => i.IdTown == townId && toDelete.Contains(i.IdLastUpdateInfo)).ExecuteDeleteAsync();
            }
            await tx.CommitAsync();
        }

        private async Task<List<(DateTime UpdateUtc, int Day)>> ReadDayPairsAsync(int townId)
        {
            var digs = await _db.MapCellDigs.AsNoTracking()
                .Where(d => d.IdCellNavigation.IdTown == townId && d.IdLastUpdateInfoNavigation != null)
                .Select(d => new { d.IdLastUpdateInfoNavigation!.DateUpdate, d.Day }).ToListAsync();
            var actions = await _db.TownCitizenDailyActions.AsNoTracking()
                .Where(a => a.IdTown == townId)
                .Select(a => new { a.IdLastUpdateInfoNavigation.DateUpdate, a.Day }).ToListAsync();
            var estimations = await _db.TownEstimations.AsNoTracking()
                .Where(e => e.IdTown == townId && e.IdLastUpdateInfoNavigation != null)
                .Select(e => new { e.IdLastUpdateInfoNavigation!.DateUpdate, e.Day }).ToListAsync();
            var routes = await _db.MapRouteGames.AsNoTracking()
                .Where(r => r.IdTown == townId && r.IdLastUpdateInfo != null)
                .Join(_db.LastUpdateInfos, r => r.IdLastUpdateInfo, l => l.IdLastUpdateInfo, (r, l) => new { l.DateUpdate, r.Day }).ToListAsync();

            return digs.Select(x => (x.DateUpdate, x.Day))
                .Concat(actions.Select(x => (x.DateUpdate, x.Day)))
                .Concat(estimations.Select(x => (x.DateUpdate, x.Day)))
                .Concat(routes.Select(x => (x.DateUpdate, x.Day)))
                .ToList();
        }
    }
}
