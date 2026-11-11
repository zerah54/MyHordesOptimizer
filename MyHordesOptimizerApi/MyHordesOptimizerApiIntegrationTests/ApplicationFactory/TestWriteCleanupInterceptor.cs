using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace MyHordesOptimizerApiIntegrationTests.ApplicationFactory
{
    /// <summary>
    /// Trace chaque ligne insérée par un test (table + valeur de clé primaire, via les métadonnées EF —
    /// aucun couplage à un type d'entité précis) et la supprime au démontage de
    /// <see cref="MyHordesOptimizerApplicationFactory"/>. Une transaction ambiante partagée était l'autre
    /// option mais casse ImportItemsAsync (BeginTransaction imbriqué) et les *LockingTests (connexions
    /// concurrentes qui doivent réellement se bloquer) — voir la revue du 2026-09-09.
    /// </summary>
    public sealed class TestWriteCleanupInterceptor : SaveChangesInterceptor
    {
        private sealed record Insert(string Table, IReadOnlyList<(string Column, object? Value)> Key);

        private readonly ConcurrentBag<Insert> _inserts = new();

        // Les villes de test dont l'IdTown est réécrit par MigrateTownId (SQL brut) ne sont plus
        // retrouvables par la clé tracée à l'insertion : on les retrouve par leur nom (préfixe de test
        // uniquement, jamais le nom d'une vraie ville) ainsi que toutes leurs lignes dépendantes.
        private static readonly string[] TestTownNamePrefixes = { "test-town", "other-town", "migrated-town" };
        private readonly ConcurrentBag<string> _townNames = new();

        // Entrées en état "Added" juste avant chaque SaveChanges : seules ces lignes-là sont des
        // insertions du test. Les entités simplement lues (référentiels réels : Item, Ruin, Building…)
        // sont aussi "Unchanged" après le save et ne doivent JAMAIS être tracées, sous peine de les supprimer.
        private readonly ConditionalWeakTable<DbContext, List<EntityEntry>> _pendingAdds = new();

        public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
        {
            CaptureAdded(eventData.Context);
            return base.SavingChanges(eventData, result);
        }

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            CaptureAdded(eventData.Context);
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        private void CaptureAdded(DbContext? context)
        {
            if (context == null) return;
            _pendingAdds.AddOrUpdate(context, context.ChangeTracker.Entries().Where(e => e.State == EntityState.Added).ToList());
        }

        public override ValueTask<int> SavedChangesAsync(
            SaveChangesCompletedEventData eventData,
            int result,
            CancellationToken cancellationToken = default)
        {
            RecordInserts(eventData.Context);
            return base.SavedChangesAsync(eventData, result, cancellationToken);
        }

        public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
        {
            RecordInserts(eventData.Context);
            return base.SavedChanges(eventData, result);
        }

        private void RecordInserts(DbContext? context)
        {
            if (context == null) return;

            // À cet instant SaveChanges a réussi et les entrées "Added" sont repassées à Unchanged,
            // mais ChangeTracker.Entries() les liste toujours avec leurs valeurs de clé désormais
            // définitives (générées ou fournies par le test) — on les capture ici plutôt que dans
            // SavingChanges pour ne jamais tracer une insertion qui a échoué.
            if (!_pendingAdds.TryGetValue(context, out var added)) return;
            _pendingAdds.Remove(context);

            foreach (var entry in added)
            {
                if (entry.State != EntityState.Unchanged) continue;

                var table = entry.Metadata.GetTableName();
                if (table == null) continue;

                var pk = entry.Metadata.FindPrimaryKey();
                if (pk == null) continue;

                var key = pk.Properties
                    .Select(p => (p.GetColumnName(), entry.Property(p.Name).CurrentValue))
                    .ToList();

                if (key.Any(k => k.Item2 == null)) continue;

                _inserts.Add(new Insert(table, key));

                if (table == "Town" && entry.Property("Name").CurrentValue is string townName
                    && TestTownNamePrefixes.Any(prefix => townName.StartsWith(prefix, StringComparison.Ordinal)))
                {
                    _townNames.Add(townName);
                }
            }
        }

        private static async Task<List<Insert>> ExpandTownsByNameAsync(List<string> names, Func<Task<DbContext>> newContext)
        {
            var expanded = new List<Insert>();
            if (names.Count == 0) return expanded;

            await using var context = await newContext();
            var townTables = await context.Database
                .SqlQueryRaw<string>(
                    "SELECT table_name AS `Value` FROM information_schema.columns " +
                    "WHERE table_schema = DATABASE() AND column_name = 'idTown' AND table_name <> 'Town' " +
                    "AND table_name NOT IN (SELECT table_name FROM information_schema.views WHERE table_schema = DATABASE())")
                .ToListAsync();

            foreach (var name in names)
            {
                var townIds = await context.Database
                    .SqlQueryRaw<int>("SELECT idTown AS `Value` FROM Town WHERE name = {0}", name)
                    .ToListAsync();
                foreach (var townId in townIds)
                {
                    foreach (var table in townTables)
                    {
                        expanded.Add(new Insert(table, new[] { ("idTown", (object?)townId) }));
                    }
                    expanded.Add(new Insert("Town", new[] { ("idTown", (object?)townId) }));
                }
            }
            return expanded;
        }

        /// <summary>
        /// Supprime tout ce qui a été tracé, table par table, en repassant tant qu'un DELETE progresse
        /// (une ligne encore référencée par une autre échoue en FK, retentée après les lignes qui la
        /// référencent). Lève une exception si un reliquat reste non supprimable : une fuite en base
        /// doit faire échouer la classe de tests, jamais passer inaperçue.
        /// </summary>
        public async Task CleanupAsync(Func<Task<DbContext>> newContext)
        {
            var remaining = _inserts.ToList();
            _inserts.Clear();
            var townNames = _townNames.Distinct().ToList();
            _townNames.Clear();
            remaining.AddRange(await ExpandTownsByNameAsync(townNames, newContext));            if (remaining.Count == 0) return;

            var madeProgress = true;
            while (remaining.Count > 0 && madeProgress)
            {
                madeProgress = false;
                var stillRemaining = new List<Insert>();

                foreach (var insert in remaining)
                {
                    await using var context = await newContext();
                    try
                    {
                        var whereClause = string.Join(" AND ", insert.Key.Select((k, i) => $"`{k.Column}` = {{{i}}}"));
                        var parameters = insert.Key.Select(k => k.Value).ToArray();
                        await context.Database.ExecuteSqlRawAsync($"DELETE FROM `{insert.Table}` WHERE {whereClause}", parameters!);
                        madeProgress = true;
                    }
                    catch
                    {
                        stillRemaining.Add(insert);
                    }
                }

                remaining = stillRemaining;
            }

            if (remaining.Count > 0)
            {
                throw new InvalidOperationException(
                    $"{remaining.Count} ligne(s) de test non supprimées de la base (encore référencées ailleurs ?) : " +
                    string.Join(", ", remaining.Select(r => r.Table).Distinct()));
            }
        }
    }
}
