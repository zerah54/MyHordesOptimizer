using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers
{
    /// <summary>Ajoute les groupes dont l'uid est absent de la ville cible. À exécuter AVANT <see cref="WishListItemMerger"/>.</summary>
    public class WishListGroupMerger : IPreTownMerger
    {
        public int Order => 0;

        public string TableName => "TownWishListGroup";

        public async Task<MergeReport> MergeAsync(MhoContext db, int fromIdTown, int toIdTown)
        {
            var sources = await db.TownWishListGroups.AsNoTracking().Where(g => g.IdTown == fromIdTown).ToListAsync();
            var existing = (await db.TownWishListGroups.AsNoTracking().Where(g => g.IdTown == toIdTown).Select(g => g.Uid).ToListAsync()).ToHashSet();
            var added = new List<string>();
            foreach (var source in sources.Where(g => !existing.Contains(g.Uid)))
            {
                db.TownWishListGroups.Add(new TownWishListGroup
                {
                    IdTown = toIdTown,
                    Uid = source.Uid,
                    Name = source.Name,
                    Priority = source.Priority,
                    ZoneXpa = source.ZoneXpa,
                    Depot = source.Depot,
                    Count = source.Count
                });
                added.Add(source.Uid);
            }
            await db.SaveChangesAsync();
            return new MergeReport(added, sources.Count - added.Count);
        }

        public async Task<int> RemoveAsync(MhoContext db, int idTown, IReadOnlyList<string> rowKeys)
        {
            return await db.TownWishListGroups.Where(g => g.IdTown == idTown && rowKeys.Contains(g.Uid)).ExecuteDeleteAsync();
        }
    }
}
