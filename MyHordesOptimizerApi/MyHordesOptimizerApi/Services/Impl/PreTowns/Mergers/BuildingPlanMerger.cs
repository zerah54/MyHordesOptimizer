using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers
{
    /// <summary>Ajoute une copie de chaque proposition ; non effective si la ville cible a déjà une effective ce jour-là.</summary>
    public class BuildingPlanMerger : IPreTownMerger
    {
        public string TableName => "TownBuildingPlan";

        public async Task<MergeReport> MergeAsync(MhoContext db, int fromIdTown, int toIdTown)
        {
            var sources = await db.TownBuildingPlans.AsNoTracking().Where(p => p.IdTown == fromIdTown).OrderBy(p => p.Day).ThenBy(p => p.IdTownBuildingPlan).ToListAsync();
            var effectiveDays = (await db.TownBuildingPlans.Where(p => p.IdTown == toIdTown && p.IsEffective).Select(p => p.Day).ToListAsync()).ToHashSet();
            var copies = new List<TownBuildingPlan>();
            foreach (var source in sources)
            {
                var copy = new TownBuildingPlan
                {
                    IdTown = toIdTown,
                    Day = source.Day,
                    Name = source.Name,
                    Content = PreTownMergers.ContentFor(source.Content, toIdTown, "Citizens")!,
                    IdAuthor = source.IdAuthor,
                    IsEffective = source.IsEffective && effectiveDays.Add(source.Day)
                };
                copies.Add(copy);
                db.TownBuildingPlans.Add(copy);
            }
            await db.SaveChangesAsync();
            return new MergeReport(copies.Select(c => c.IdTownBuildingPlan.ToString()).ToList(), 0);
        }

        public async Task<int> RemoveAsync(MhoContext db, int idTown, IReadOnlyList<string> rowKeys)
        {
            var ids = rowKeys.Select(k => int.TryParse(k, out var id) ? id : (int?)null).Where(id => id.HasValue).Select(id => id!.Value).ToList();
            return await db.TownBuildingPlans.Where(p => p.IdTown == idTown && ids.Contains(p.IdTownBuildingPlan)).ExecuteDeleteAsync();
        }
    }
}
