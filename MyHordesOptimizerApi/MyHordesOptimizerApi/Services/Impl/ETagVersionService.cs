using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;
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

        // Empreinte de tout ce que sert MyHordesFetcherService.GetCitizens : beaucoup de champs s'écrivent sans IdLastUpdateInfo
        // (campings, chaussures, contenu du sac...), d'où les valeurs elles-mêmes plutôt qu'un count:max.
        private string? CitizensVersion(int mapId)
        {
            var townId = _dbContext.ResolveTownId(mapId);
            var lastUpdateIds = new HashSet<int>();
            var citizens = _dbContext.TownCitizens.Where(c => c.IdTown == townId);
            var rows = RowsOf(citizens, lastUpdateIds);
            if (rows.Count == 0) return null;

            var bagItems = _dbContext.BagItems.Where(i => citizens.Any(c => c.IdBag == i.IdBag));
            var chestItems = _dbContext.ChestItems.Where(i => citizens.Any(c => c.IdChest == i.IdChest));
            // Ids calculés une fois : MySQL ne sait pas semi-joindre un OR de deux EXISTS (sous-requête dépendante par objet).
            var itemIds = bagItems.Select(i => i.IdItem).Union(chestItems.Select(i => i.IdItem)).ToList();
            var items = _dbContext.Items.Where(it => itemIds.Contains(it.IdItem));
            var cadavers = _dbContext.TownCadavers.Where(c => c.IdTown == townId);
            rows.AddRange(RowsOf(_dbContext.Bags.Where(b => citizens.Any(c => c.IdBag == b.IdBag)), lastUpdateIds));
            rows.AddRange(RowsOf(bagItems, lastUpdateIds));
            rows.AddRange(RowsOf(_dbContext.Chests.Where(ch => citizens.Any(c => c.IdChest == ch.IdChest)), lastUpdateIds));
            rows.AddRange(RowsOf(chestItems, lastUpdateIds));
            rows.AddRange(RowsOf(items, lastUpdateIds));
            rows.AddRange(RowsOf(_dbContext.TownCitizenDailyActions.Where(a => a.IdTown == townId), lastUpdateIds));
            rows.AddRange(RowsOf(cadavers, lastUpdateIds));
            rows.AddRange(RowsOf(_dbContext.CauseOfDeaths.Where(cd => cadavers.Any(c => c.CauseOfDeath == cd.Dtype)), lastUpdateIds));
            rows.AddRange(Serialized("ItemProperty", items.Select(it => new { it.IdItem, Names = it.PropertyNames.Select(p => p.Name).OrderBy(n => n).ToList() })));
            rows.AddRange(Serialized(nameof(User), _dbContext.Users.Where(u => citizens.Any(c => c.IdUser == u.IdUser)).Select(u => new { u.IdUser, u.Name, u.Avatar })));
            rows.AddRange(Serialized(nameof(Town), _dbContext.Towns.Where(t => t.IdTown == townId).Select(t => new { t.IdShaman, t.IdGuide, t.IdCata })));
            rows.AddRange(Serialized(nameof(LastUpdateInfo), _dbContext.LastUpdateInfos.Where(l => lastUpdateIds.Contains(l.IdLastUpdateInfo) && l.IdUserNavigation != null)
                .Select(l => new { l.IdUserNavigation!.IdUser, l.IdUserNavigation.Name }).Distinct()));
            // Tri en mémoire : indépendant de l'ordre renvoyé par la base. SHA256 car string.GetHashCode change à chaque démarrage.
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(string.Join('\n', rows.Order(StringComparer.Ordinal)))));
        }

        /// <summary>
        /// Lignes sérialisées avec toutes leurs colonnes mappées par EF (une colonne ajoutée plus tard entre d'office),
        /// en relevant au passage leurs clés étrangères vers LastUpdateInfo dans <paramref name="lastUpdateIds"/>.
        /// </summary>
        private List<string> RowsOf<T>(IQueryable<T> query, HashSet<int> lastUpdateIds) where T : class
        {
            var entityType = _dbContext.Model.FindEntityType(typeof(T))!;
            var properties = entityType.GetProperties().Where(p => p.PropertyInfo is not null).ToList();
            var lastUpdateProperties = entityType.GetForeignKeys()
                .Where(fk => fk.PrincipalEntityType.ClrType == typeof(LastUpdateInfo))
                .SelectMany(fk => fk.Properties)
                .ToList();
            var entities = query.AsNoTracking().ToList();
            lastUpdateIds.UnionWith(entities.SelectMany(row => lastUpdateProperties.Select(p => p.PropertyInfo!.GetValue(row))).OfType<int>());
            return Serialized(entityType.ShortName(), entities.Select(row => properties.Select(p => p.PropertyInfo!.GetValue(row))));
        }

        /// <summary>Préfixe = table d'origine : deux lignes de même forme venant de tables différentes ne se confondent pas.</summary>
        private static List<string> Serialized<T>(string prefix, IEnumerable<T> rows)
            => rows.Select(row => prefix + JsonSerializer.Serialize(row)).ToList();

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
