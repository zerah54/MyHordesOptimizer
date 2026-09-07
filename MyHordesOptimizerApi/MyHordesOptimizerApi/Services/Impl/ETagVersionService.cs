using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl
{
    /// <inheritdoc cref="IETagVersionService"/>
    public class ETagVersionService : IETagVersionService
    {
        private readonly MhoContext _dbContext;

        public ETagVersionService(MhoContext dbContext)
        {
            _dbContext = dbContext;
        }

        public string? GetVersion(ETagResource resource, int? id, int currentUserId)
            => resource switch
            {
                ETagResource.Bank => id.HasValue ? BankVersion(id.Value) : null,
                ETagResource.Citizens => id.HasValue ? CitizensVersion(id.Value) : null,
                ETagResource.WishList => id.HasValue ? WishListVersion(id.Value) : null,
                ETagResource.Map => id.HasValue ? MapVersion(id.Value) : null,
                ETagResource.MapDigs => id.HasValue ? MapDigsVersion(id.Value) : null,
                ETagResource.NoteMyTown => NoteVersion(_dbContext.TownNotes.Where(n => n.IdUserAuthor == currentUserId).Select(n => n.UpdatedAt)),
                ETagResource.NoteMyUser => NoteVersion(_dbContext.UserNotes.Where(n => n.IdUserAuthor == currentUserId && n.IdTown == 0).Select(n => n.UpdatedAt)),
                ETagResource.NoteUser => id.HasValue
                    ? NoteVersion(_dbContext.UserNotes.Where(n => n.IdUserAuthor == currentUserId && n.IdUserTarget == id.Value && n.IdTown == 0).Select(n => n.UpdatedAt))
                    : null,
                ETagResource.NoteMyCitizen => id.HasValue
                    ? NoteVersion(_dbContext.UserNotes.Where(n => n.IdUserAuthor == currentUserId && n.IdTown == _dbContext.ResolveTownId(id.Value)).Select(n => n.UpdatedAt))
                    : null,
                ETagResource.NoteMyCitizenForUser => id.HasValue
                    ? NoteVersion(_dbContext.UserNotes.Where(n => n.IdUserAuthor == currentUserId && n.IdUserTarget == id.Value && n.IdTown != 0).Select(n => n.UpdatedAt))
                    : null,
                _ => null
            };

        // Fetcher/Bank sans townId synchronise MyHordes en écriture (voir MyHordesFetcherService.GetBank()) :
        // pas de version bon marché possible pour ce chemin, on ne met jamais en cache.
        private string? BankVersion(int mapId)
        {
            var townId = _dbContext.ResolveTownId(mapId);
            return CountMaxVersion(_dbContext.TownBankItems.Where(x => x.IdTown == townId).Select(x => (int?)x.IdLastUpdateInfo));
        }

        private string? CitizensVersion(int mapId)
        {
            var townId = _dbContext.ResolveTownId(mapId);
            return CountMaxVersion(_dbContext.TownCitizens.Where(x => x.IdTown == townId).Select(x => (int?)x.IdLastUpdateInfo));
        }

        // Une seule colonne (Town.WishlistDateUpdate), pas d'agrégation : voir WishListService.GetWishListByResolvedTownId.
        private string? WishListVersion(int mapId)
        {
            var townId = _dbContext.ResolveTownId(mapId);
            var updated = _dbContext.Towns.Where(t => t.IdTown == townId).Select(t => t.WishlistDateUpdate).FirstOrDefault();
            return updated.HasValue ? updated.Value.Ticks.ToString() : null;
        }

        // Agrège aussi IdScoutEstimationLastUpdateInfo : MyHordesOptimizerCellDto sérialise les deux
        // horodatages indépendamment (estimation Éclaireur distincte de la donnée confirmée).
        private string? MapVersion(int mapId)
        {
            var townId = _dbContext.ResolveTownId(mapId);
            // AsNoTracking : sans ça, un DbContext scoped réutilisé (résolution d'identité EF) renverrait
            // l'entité déjà suivie depuis un appel précédent au lieu de relire l'état courant en base.
            var cells = _dbContext.MapCells.AsNoTracking().Where(c => c.IdTown == townId).ToList();
            if (cells.Count == 0) return null;
            var max = cells.Max(c => Math.Max(c.IdLastUpdateInfo ?? 0, c.IdScoutEstimationLastUpdateInfo ?? 0));
            return $"{cells.Count}:{max}";
        }

        private string? MapDigsVersion(int mapId)
        {
            var townId = _dbContext.ResolveTownId(mapId);
            return CountMaxVersion(_dbContext.MapCellDigs.Where(d => d.IdCellNavigation.IdTown == townId).Select(d => d.IdLastUpdateInfo));
        }

        private static string? CountMaxVersion(IQueryable<int?> idLastUpdateInfos)
        {
            var ids = idLastUpdateInfos.ToList();
            if (ids.Count == 0) return null;
            return $"{ids.Count}:{ids.Max(id => id ?? 0)}";
        }

        private static string? NoteVersion(IQueryable<DateTime> updatedAtValues)
        {
            var values = updatedAtValues.ToList();
            if (values.Count == 0) return null;
            return $"{values.Count}:{values.Max().Ticks}";
        }
    }
}
