using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
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
            foreach (var entry in context.ChangeTracker.Entries())
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
            }
        }

        /// <summary>
        /// Supprime tout ce qui a été tracé, table par table, en repassant tant qu'un DELETE progresse
        /// (une ligne encore référencée par une autre échoue en FK, retentée après les lignes qui la
        /// référencent). Ne jette jamais : un reliquat non supprimable est loggé, pas bloquant pour la
        /// suite de tests suivante.
        /// </summary>
        public async Task CleanupAsync(Func<Task<DbContext>> newContext)
        {
            var remaining = _inserts.ToList();
            _inserts.Clear();
            if (remaining.Count == 0) return;

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
                        await context.Database.ExecuteSqlRawAsync($"DELETE FROM `{insert.Table}` WHERE {whereClause}", parameters);
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
                Console.Error.WriteLine(
                    $"TestWriteCleanupInterceptor: {remaining.Count} ligne(s) de test non supprimées " +
                    $"(encore référencées ailleurs) : {string.Join(", ", remaining.Select(r => r.Table))}");
            }
        }
    }
}
