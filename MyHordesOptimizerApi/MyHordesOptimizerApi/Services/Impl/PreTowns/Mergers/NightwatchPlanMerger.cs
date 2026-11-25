using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers
{
    /// <summary>Ajoute une copie détachée de chaque proposition (hors propositions de simulation non effectives) ; non effective si la ville cible a déjà une effective ce jour-là.</summary>
    public class NightwatchPlanMerger : IPreTownMerger
    {
        public string TableName => "TownNightwatchPlan";

        public async Task<MergeReport> MergeAsync(MhoContext db, int fromIdTown, int toIdTown)
        {
            // Une proposition de simulation non effective deviendrait une proposition ordinaire parasite une fois détachée.
            var sources = await db.TownNightwatchPlans.AsNoTracking()
                .Where(p => p.IdTown == fromIdTown && (p.IdTownNightwatchSimulation == null || p.IsEffective)).OrderBy(p => p.Day).ThenBy(p => p.IdTownNightwatchPlan).ToListAsync();
            var effectiveDays = (await db.TownNightwatchPlans.Where(p => p.IdTown == toIdTown && p.IsEffective).Select(p => p.Day).ToListAsync()).ToHashSet();
            var copies = new List<TownNightwatchPlan>();
            foreach (var source in sources)
            {
                var copy = new TownNightwatchPlan
                {
                    IdTown = toIdTown,
                    Day = source.Day,
                    Name = source.Name,
                    Content = PreTownMergers.ContentFor(source.Content, toIdTown, "Watchers")!,
                    IdAuthor = source.IdAuthor,
                    IdTownNightwatchSimulation = null,
                    IsEffective = source.IsEffective && effectiveDays.Add(source.Day)
                };
                copies.Add(copy);
                db.TownNightwatchPlans.Add(copy);
            }
            await db.SaveChangesAsync();
            return new MergeReport(copies.Select(c => c.IdTownNightwatchPlan.ToString()).ToList(), 0);
        }

        public async Task<int> RemoveAsync(MhoContext db, int idTown, IReadOnlyList<string> rowKeys)
        {
            var ids = rowKeys.Select(k => int.TryParse(k, out var id) ? id : (int?)null).Where(id => id.HasValue).Select(id => id!.Value).ToList();
            return await db.TownNightwatchPlans.Where(p => p.IdTown == idTown && ids.Contains(p.IdTownNightwatchPlan)).ExecuteDeleteAsync();
        }
    }
}
