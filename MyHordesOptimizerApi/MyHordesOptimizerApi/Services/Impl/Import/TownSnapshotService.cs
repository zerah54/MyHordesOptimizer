using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Import;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.Import
{
    public class TownSnapshotService : ITownSnapshotService
    {
        public const string SnapshotImportStep = "town-snapshot";

        private const int BatchSize = 50;
        private const int WitnessSeed = 20261102;
        private const int WitnessFinishedCount = 180;
        private const int WitnessUnfinishedCount = 20;

        private readonly MhoContext _dbContext;
        private readonly IMyHordesApiRepository _myHordesApiRepository;
        private readonly ILogger<TownSnapshotService> _logger;

        public TownSnapshotService(MhoContext dbContext, IMyHordesApiRepository myHordesApiRepository, ILogger<TownSnapshotService> logger)
        {
            _dbContext = dbContext;
            _myHordesApiRepository = myHordesApiRepository;
            _logger = logger;
        }

        // Classes dans l'ordre de priorité : une ville garde la première qui s'applique.
        // Seules les clés positives sont candidates : une ligne provisoire (-mapId) n'a pas d'id de classement.
        public IReadOnlyList<(int RankingId, string SuspectClass)> SelectCandidates()
        {
            var result = new List<(int RankingId, string SuspectClass)>();
            var seen = new HashSet<int>();

            void Add(string suspectClass, IEnumerable<int> ids)
            {
                foreach (var id in ids.Where(id => id > 0))
                {
                    if (seen.Add(id))
                    {
                        result.Add((id, suspectClass));
                    }
                }
            }

            Add("C", Query(@"
                SELECT idTown AS Value FROM (
                    SELECT idTown,
                           CAST(ROW_NUMBER() OVER (ORDER BY idTown) AS SIGNED) AS rankById,
                           CAST(ROW_NUMBER() OVER (ORDER BY mapId, idTown) AS SIGNED) AS rankByMap
                    FROM Town WHERE phase = 3 AND idTown > 0 AND mapId IS NOT NULL
                ) ranked
                WHERE ABS(rankById - rankByMap) > 20
                ORDER BY idTown"));
            var alphaTowns = _myHordesApiRepository.GetAlphaTownList();
            if (alphaTowns == null || alphaTowns.Count == 0)
            {
                throw new InvalidOperationException("La liste des villes alpha (/json/townlist?season=a) est vide : la classe ALPHA ne peut pas être capturée en silence.");
            }
            Add("ALPHA", alphaTowns);
            Add("A", Query("SELECT idTown AS Value FROM Town WHERE phase = 0 AND idTown > 0 ORDER BY idTown"));
            Add("A'", Query(@"
                SELECT idTown AS Value FROM Town
                WHERE phase = 2 AND season = 0 AND isFinished = 1 AND mapId <= 933 AND idTown > 0
                ORDER BY idTown"));
            Add("B", Query(@"
                SELECT t.idTown AS Value
                FROM Town t
                JOIN (SELECT mapId, season, MIN(idTown) AS minId
                      FROM Town
                      WHERE phase = 2 AND idTown > 0 AND mapId IS NOT NULL
                      GROUP BY mapId, season
                      HAVING COUNT(*) >= 2) g ON g.mapId = t.mapId AND g.season <=> t.season
                JOIN Town smallest ON smallest.idTown = g.minId AND smallest.isFinished = 1
                WHERE t.phase = 2 AND t.idTown > 0
                ORDER BY t.idTown"));
            Add("E", Query(@"
                SELECT t.idTown AS Value FROM Town t
                WHERE t.phase = 3 AND t.idTown > 0
                  AND EXISTS (SELECT 1 FROM Town provisional WHERE provisional.idTown = -t.mapId)
                ORDER BY t.idTown"));
            Add("N19", Query("SELECT idTown AS Value FROM Town WHERE phase = 3 AND idTown > 0 AND season = 19 ORDER BY idTown"));
            Add("D", Query(@"
                SELECT idTown AS Value FROM Town
                WHERE phase = 2 AND idTown > 0
                  AND mapId BETWEEN (SELECT MIN(mapId) FROM Town WHERE phase = 3 AND season = 19 AND mapId > 0)
                                AND (SELECT MAX(mapId) FROM Town WHERE phase = 3 AND season = 19 AND mapId > 0)
                ORDER BY idTown"));
            Add("T", SelectWitnesses(seen));

            return result;
        }

        // Les témoins déjà capturés restent les mêmes ; le tirage reproductible complète jusqu'à 180 terminés
        // et 20 non terminés, les captures comptant selon le isFinished actuel de leur ligne Town.
        private IEnumerable<int> SelectWitnesses(HashSet<int> alreadyClassified)
        {
            var captured = Query("SELECT rankingId AS Value FROM TownRankingSnapshot WHERE suspectClass = 'T' ORDER BY rankingId");
            var capturedSet = captured.ToHashSet();

            int CapturedCount(int finished) => Query(
                $"SELECT t.idTown AS Value FROM Town t JOIN TownRankingSnapshot s ON s.rankingId = t.idTown WHERE s.suspectClass = 'T' AND t.phase = 2 AND t.isFinished = {finished}").Count;

            IEnumerable<int> Draw(int finished, int wanted)
            {
                var missing = wanted - CapturedCount(finished);
                return missing <= 0
                    ? Enumerable.Empty<int>()
                    : Query($"SELECT idTown AS Value FROM Town WHERE phase = 2 AND isFinished = {finished} AND idTown > 0 ORDER BY RAND({WitnessSeed})")
                        .Where(id => !alreadyClassified.Contains(id) && !capturedSet.Contains(id))
                        .Take(missing);
            }

            return captured.Concat(Draw(1, WitnessFinishedCount)).Concat(Draw(0, WitnessUnfinishedCount)).ToList();
        }

        private List<int> Query(string sql) => _dbContext.Database.SqlQueryRaw<int>(sql).ToList();

        public async Task CaptureAsync(bool refresh, IReadOnlyCollection<int>? onlyRankingIds, Action<ImportStepProgress>? onStep)
        {
            var candidates = SelectCandidates().AsEnumerable();
            if (onlyRankingIds != null)
            {
                var only = onlyRankingIds.ToHashSet();
                candidates = candidates.Where(c => only.Contains(c.RankingId));
            }
            var wanted = candidates.ToList();

            if (!refresh)
            {
                var captured = (await _dbContext.TownRankingSnapshots.AsNoTracking().Select(s => s.RankingId).ToListAsync()).ToHashSet();
                wanted = wanted.Where(c => !captured.Contains(c.RankingId)).ToList();
            }

            var done = 0;
            string? message = null;
            foreach (var batch in wanted.Chunk(BatchSize))
            {
                List<MyHordesTownDetailsDto> towns;
                try
                {
                    towns = _myHordesApiRepository.GetTownDetails(batch.Select(c => c.RankingId).ToList());
                }
                catch (MyHordesApiException ex) when (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                {
                    // Quota atteint : le lot en cours n'a rien écrit, les précédents sont commités.
                    message = $"Quota MyHordes atteint : {done}/{wanted.Count} villes capturées. Relance la capture dans une heure.";
                    _logger.LogWarning(ex, "TownSnapshot : quota MyHordes atteint après {Done}/{Total} villes, arrêt propre.", done, wanted.Count);
                    break;
                }

                await SaveBatchAsync(batch, towns);
                done += batch.Length;
                onStep?.Invoke(new ImportStepProgress(SnapshotImportStep, done, wanted.Count));
            }

            if (message != null)
            {
                onStep?.Invoke(new ImportStepProgress(SnapshotImportStep, done, wanted.Count, message));
            }
        }

        // Un lot s'écrit en une transaction : une interruption ne laisse jamais une ville sans ses citoyens.
        private async Task SaveBatchAsync((int RankingId, string SuspectClass)[] batch, List<MyHordesTownDetailsDto> towns)
        {
            var returned = towns.Where(t => t.Id.HasValue).GroupBy(t => t.Id!.Value).ToDictionary(g => g.Key, g => g.First());
            var ids = batch.Select(c => c.RankingId).ToList();
            var now = DateTime.UtcNow;

            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            var existing = await _dbContext.TownRankingSnapshots.Where(s => ids.Contains(s.RankingId)).ToDictionaryAsync(s => s.RankingId);

            // Une ville déjà capturée et désormais non renvoyée garde sa preuve (colonnes, citoyens, capturedAt).
            var rewritten = batch.Where(c => returned.ContainsKey(c.RankingId) || !existing.ContainsKey(c.RankingId)).Select(c => c.RankingId).ToList();
            await _dbContext.TownRankingSnapshotCitizens.Where(c => rewritten.Contains(c.RankingId)).ExecuteDeleteAsync();

            foreach (var (rankingId, suspectClass) in batch)
            {
                returned.TryGetValue(rankingId, out var dto);
                if (dto == null && existing.TryGetValue(rankingId, out var kept))
                {
                    if (!kept.IsAbsent)
                    {
                        _logger.LogWarning("TownSnapshot : la ville {RankingId} déjà capturée n'est plus renvoyée par MyHordes, preuve conservée et marquée absente.", rankingId);
                    }
                    kept.IsAbsent = true;
                    continue;
                }

                if (!existing.TryGetValue(rankingId, out var row))
                {
                    row = new TownRankingSnapshot { RankingId = rankingId };
                    _dbContext.TownRankingSnapshots.Add(row);
                }
                row.SuspectClass = suspectClass;
                row.CapturedAt = now;
                row.IsAbsent = dto == null;
                row.MapId = dto?.MapId;
                row.PhaseLabel = dto?.Phase;
                row.Season = dto?.Season;
                row.Language = dto?.Language;
                row.Name = dto?.Name;
                row.Day = dto?.Day;
                row.Score = dto?.Score;

                var citizenIds = dto?.Citizens?.Where(c => c.Id.HasValue).Select(c => c.Id!.Value).Distinct() ?? Enumerable.Empty<int>();
                _dbContext.TownRankingSnapshotCitizens.AddRange(
                    citizenIds.Select(idUser => new TownRankingSnapshotCitizen { RankingId = rankingId, IdUser = idUser }));
            }

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            _dbContext.ChangeTracker.Clear();
        }
    }
}
