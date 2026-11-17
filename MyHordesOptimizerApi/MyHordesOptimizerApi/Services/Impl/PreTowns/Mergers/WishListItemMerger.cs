using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers
{
    /// <summary>
    /// Ajoute les objets dont (idItem, zoneXpa) est absent de la ville cible. Le groupUid est remis à null si la ville cible
    /// n'a pas ce groupe : exécuter <see cref="WishListGroupMerger"/> d'abord.
    /// </summary>
    public class WishListItemMerger : IPreTownMerger
    {
        public int Order => 1;

        public string TableName => "TownWishListItem";

        public async Task<MergeReport> MergeAsync(MhoContext db, int fromIdTown, int toIdTown)
        {
            var sources = await db.TownWishListItems.AsNoTracking().Where(i => i.IdTown == fromIdTown).ToListAsync();
            var existing = (await db.TownWishListItems.AsNoTracking().Where(i => i.IdTown == toIdTown).Select(i => new { i.IdItem, i.ZoneXpa }).ToListAsync())
                .Select(i => (i.IdItem, i.ZoneXpa)).ToHashSet();
            var groups = (await db.TownWishListGroups.AsNoTracking().Where(g => g.IdTown == toIdTown).Select(g => g.Uid).ToListAsync()).ToHashSet();
            groups.UnionWith(db.TownWishListGroups.Local.Where(g => g.IdTown == toIdTown).Select(g => g.Uid));
            var added = new List<string>();
            foreach (var source in sources.Where(i => !existing.Contains((i.IdItem, i.ZoneXpa))))
            {
                db.TownWishListItems.Add(new TownWishListItem
                {
                    IdTown = toIdTown,
                    IdItem = source.IdItem,
                    ZoneXpa = source.ZoneXpa,
                    Priority = source.Priority,
                    Count = source.Count,
                    Depot = source.Depot,
                    ShouldSignal = source.ShouldSignal,
                    GroupUid = source.GroupUid is not null && groups.Contains(source.GroupUid) ? source.GroupUid : null
                });
                added.Add($"{source.IdItem}|{source.ZoneXpa}");
            }
            await db.SaveChangesAsync();
            return new MergeReport(added, sources.Count - added.Count);
        }

        public async Task<int> RemoveAsync(MhoContext db, int idTown, IReadOnlyList<string> rowKeys)
        {
            var keys = rowKeys.Select(k => k.Split('|')).Where(p => p.Length == 2 && int.TryParse(p[0], out _) && int.TryParse(p[1], out _))
                .Select(p => (IdItem: int.Parse(p[0]), ZoneXpa: int.Parse(p[1]))).ToHashSet();
            var itemIds = keys.Select(k => k.IdItem).Distinct().ToList();
            var candidates = await db.TownWishListItems.Where(i => i.IdTown == idTown && itemIds.Contains(i.IdItem)).ToListAsync();
            var rows = candidates.Where(i => keys.Contains((i.IdItem, i.ZoneXpa))).ToList();
            db.TownWishListItems.RemoveRange(rows);
            await db.SaveChangesAsync();
            return rows.Count;
        }
    }
}
