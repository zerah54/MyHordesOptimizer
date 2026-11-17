using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.PreTowns;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.PreTowns
{
    /// <summary>
    /// Les mergers s'exécutent dans une seule transaction, dans l'ordre de leur rang (groupes de souhaits avant objets) ;
    /// chaque ligne ajoutée est journalisée pour que le détachement ne supprime que ces lignes.
    /// </summary>
    public class PreTownLinkService : IPreTownLinkService
    {
        public static readonly TimeSpan UnlinkWindow = TimeSpan.FromHours(1);

        protected MhoContext DbContext { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected ITownAccessService TownAccessService { get; init; }
        protected IReadOnlyList<IPreTownMerger> Mergers { get; init; }
        protected TimeProvider TimeProvider { get; init; }
        protected TownSyncLock TownSyncLock { get; init; }

        public PreTownLinkService(MhoContext dbContext, IUserInfoProvider userInfoProvider, ITownAccessService townAccessService,
            IEnumerable<IPreTownMerger> mergers, TimeProvider timeProvider, TownSyncLock townSyncLock)
        {
            DbContext = dbContext;
            UserInfoProvider = userInfoProvider;
            TownAccessService = townAccessService;
            Mergers = PreTownMergers.Sorted(mergers);
            TimeProvider = timeProvider;
            TownSyncLock = townSyncLock;
        }

        /// <summary>
        /// Raison pour laquelle le détachement est refusé, null s'il est possible. Règle unique, partagée avec
        /// <see cref="PreTownDto.CanUnlink"/>. Ville terminée : <c>IsFinished</c>, ou des citoyens connus et tous morts
        /// (une ville sans citoyen synchronisé n'est pas terminée, juste pas encore lue).
        /// </summary>
        public static async Task<string?> GetUnlinkRefusalAsync(MhoContext db, PreTown preTown, DateTime utcNow)
        {
            if (preTown.LinkedIdTown is not int idTown || preTown.LinkedAt is not DateTime linkedAt)
            {
                return "Cette pré-ville n'est pas liée.";
            }
            if (utcNow - linkedAt > UnlinkWindow)
            {
                return "Le délai pour délier la pré-ville est dépassé.";
            }
            var finished = await db.Towns.AsNoTracking().AnyAsync(t => t.IdTown == idTown && t.IsFinished)
                || (await db.TownCitizens.AsNoTracking().AnyAsync(c => c.IdTown == idTown)
                    && !await db.TownCitizens.AsNoTracking().AnyAsync(c => c.IdTown == idTown && c.Dead != true));
            return finished ? "La ville est terminée." : null;
        }

        public async Task<LinkPreviewDto> PreviewAsync(int preTownId)
        {
            await EnsureOrganizerAsync(preTownId);
            var (mapId, idTown) = await ResolveTargetAsync();
            await using var gate = await AcquireLocksAsync(preTownId, mapId, idTown);
            await using var tx = await DbContext.Database.BeginTransactionAsync();
            await EnsureLinkableAsync(preTownId, idTown);
            var (result, _) = await RunMergersAsync(preTownId, idTown);
            await tx.RollbackAsync();
            DbContext.ChangeTracker.Clear();
            var name = await DbContext.Towns.AsNoTracking().Where(t => t.IdTown == idTown).Select(t => t.Name).SingleAsync();
            return new LinkPreviewDto { Added = result.Added, Skipped = result.Skipped, SkippedNotes = result.SkippedNotes, MapId = mapId, TownName = name };
        }

        public async Task<LinkResultDto> LinkAsync(int preTownId)
        {
            await EnsureOrganizerAsync(preTownId);
            var (mapId, idTown) = await ResolveTargetAsync();
            await using var gate = await AcquireLocksAsync(preTownId, mapId, idTown);
            await using var tx = await DbContext.Database.BeginTransactionAsync();
            await EnsureLinkableAsync(preTownId, idTown);
            var (result, entries) = await RunMergersAsync(preTownId, idTown);
            DbContext.PreTownLinkEntries.AddRange(entries);
            var preTown = await DbContext.PreTowns.SingleAsync(p => p.IdPreTown == preTownId);
            preTown.LinkedIdTown = idTown;
            preTown.LinkedMapId = mapId;
            preTown.LinkedAt = TimeProvider.GetUtcNow().UtcDateTime;
            preTown.IdLinker = UserInfoProvider.UserId;
            await DbContext.SaveChangesAsync();
            await tx.CommitAsync();
            return result;
        }

        public async Task UnlinkAsync(int preTownId)
        {
            await EnsureOrganizerAsync(preTownId);
            var snapshot = await DbContext.PreTowns.AsNoTracking().SingleAsync(p => p.IdPreTown == preTownId);
            if (snapshot.LinkedIdTown is not int snapshotIdTown)
            {
                throw new MhoBadRequestException("Cette pré-ville n'est pas liée.");
            }
            await using var gate = await AcquireLocksAsync(preTownId, snapshot.LinkedMapId ?? -snapshotIdTown, snapshotIdTown);
            await using var tx = await DbContext.Database.BeginTransactionAsync();
            // Relecture sous verrou : un re-lien frais ne doit pas être défait sur la foi d'un état périmé.
            var preTown = await DbContext.PreTowns.SingleAsync(p => p.IdPreTown == preTownId);
            await DbContext.Entry(preTown).ReloadAsync();
            var refusal = await GetUnlinkRefusalAsync(DbContext, preTown, TimeProvider.GetUtcNow().UtcDateTime);
            if (refusal is not null)
            {
                throw new MhoBadRequestException(refusal);
            }
            var idTown = preTown.LinkedIdTown!.Value;
            var entries = await DbContext.PreTownLinkEntries.Where(e => e.IdPreTown == preTownId).ToListAsync();
            var wishListChanged = false;
            foreach (var merger in Mergers.Reverse())
            {
                var keys = entries.Where(e => e.TableName == merger.TableName).Select(e => e.RowKey).ToList();
                if (keys.Count > 0)
                {
                    var removed = await merger.RemoveAsync(DbContext, idTown, keys);
                    wishListChanged |= removed > 0 && PreTownMergers.IsWishList(merger);
                }
            }
            if (wishListChanged)
            {
                await PreTownMergers.TouchWishListAsync(DbContext, idTown, UserInfoProvider.UserId);
            }
            DbContext.PreTownLinkEntries.RemoveRange(entries);
            preTown.LinkedIdTown = null;
            preTown.LinkedMapId = null;
            preTown.LinkedAt = null;
            preTown.IdLinker = null;
            await DbContext.SaveChangesAsync();
            await tx.CommitAsync();
        }

        /// <summary>
        /// Verrous de synchro de la ville : clé -mapId (celle de la synchro/connexion) et -idTown si différente, plus la ville
        /// fantôme (exclut les écritures sur la pré-ville et une double liaison). Acquis par ordre croissant.
        /// </summary>
        private Task<IAsyncDisposable> AcquireLocksAsync(int preTownId, int mapId, int idTown)
            => TownSyncLock.AcquireTownsAsync(new[] { -mapId, -idTown, PreTownIds.ToIdTown(preTownId) });

        private async Task EnsureOrganizerAsync(int preTownId)
        {
            var userId = UserInfoProvider.UserId;
            var me = await DbContext.PreTownMembers.AsNoTracking().SingleOrDefaultAsync(m => m.IdPreTown == preTownId && m.IdUser == userId)
                ?? throw new MhoForbiddenException("Vous n'êtes pas membre de cette pré-ville.");
            if (!me.IsOrganizer)
            {
                throw new MhoForbiddenException("Réservé aux organisateurs de la pré-ville.");
            }
        }

        /// <summary>Ville réelle actuelle du jeton, dont l'utilisateur est citoyen.</summary>
        private async Task<(int mapId, int idTown)> ResolveTargetAsync()
        {
            var mapId = UserInfoProvider.TownDetail?.TownId ?? 0;
            if (mapId <= 0 || PreTownIds.IsPreTownMapId(mapId))
            {
                throw new MhoForbiddenException("Vous n'êtes citoyen d'aucune ville en cours.");
            }
            await TownAccessService.EnsureCanWriteMapAsync(mapId);
            var idTown = DbContext.ResolveTownId(mapId);
            if (!await DbContext.Towns.AsNoTracking().AnyAsync(t => t.IdTown == idTown))
            {
                throw new MhoBadRequestException("Votre ville n'est pas encore connue de MyHordesOptimizer.");
            }
            return (mapId, idTown);
        }

        private async Task EnsureLinkableAsync(int preTownId, int idTown)
        {
            var preTown = await DbContext.PreTowns.AsNoTracking().SingleOrDefaultAsync(p => p.IdPreTown == preTownId)
                ?? throw new MhoNotFoundException("Pré-ville introuvable.");
            if (preTown.LinkedIdTown is not null)
            {
                throw new MhoBadRequestException("Cette pré-ville est déjà liée à une ville.");
            }
            if (await DbContext.PreTowns.AsNoTracking().AnyAsync(p => p.LinkedIdTown == idTown))
            {
                throw new MhoBadRequestException("Cette ville est déjà liée à une autre pré-ville.");
            }
        }

        private async Task<(LinkResultDto result, List<PreTownLinkEntry> entries)> RunMergersAsync(int preTownId, int toIdTown)
        {
            var from = PreTownIds.ToIdTown(preTownId);
            var result = new LinkResultDto();
            var entries = new List<PreTownLinkEntry>();
            var wishListChanged = false;
            foreach (var merger in Mergers)
            {
                var report = await merger.MergeAsync(DbContext, from, toIdTown);
                wishListChanged |= report.AddedRowKeys.Count > 0 && PreTownMergers.IsWishList(merger);
                result.Added += report.AddedRowKeys.Count;
                result.Skipped += report.Skipped;
                if (merger is NoteMerger)
                {
                    result.SkippedNotes += report.Skipped;
                }
                entries.AddRange(report.AddedRowKeys.Select(k => new PreTownLinkEntry { IdPreTown = preTownId, TableName = merger.TableName, RowKey = k }));
            }
            if (wishListChanged)
            {
                await PreTownMergers.TouchWishListAsync(DbContext, toIdTown, UserInfoProvider.UserId);
            }
            return (result, entries);
        }
    }
}
