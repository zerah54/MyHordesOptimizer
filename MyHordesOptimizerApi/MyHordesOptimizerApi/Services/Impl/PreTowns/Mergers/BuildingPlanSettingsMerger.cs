using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers
{
    /// <summary>Copie les réglages sauf si la ville cible en a déjà.</summary>
    public class BuildingPlanSettingsMerger : IPreTownMerger
    {
        public string TableName => "TownBuildingPlanSettings";

        public async Task<MergeReport> MergeAsync(MhoContext db, int fromIdTown, int toIdTown)
        {
            var source = await db.TownBuildingPlanSettings.AsNoTracking().SingleOrDefaultAsync(s => s.IdTown == fromIdTown);
            if (source is null)
            {
                return new MergeReport(new List<string>(), 0);
            }
            if (await db.TownBuildingPlanSettings.AnyAsync(s => s.IdTown == toIdTown))
            {
                return new MergeReport(new List<string>(), 1);
            }
            db.TownBuildingPlanSettings.Add(new TownBuildingPlanSettings { IdTown = toIdTown, ItemValues = source.ItemValues, Version = 1 });
            await db.SaveChangesAsync();
            return new MergeReport(new List<string> { toIdTown.ToString() }, 0);
        }

        public async Task<int> RemoveAsync(MhoContext db, int idTown, IReadOnlyList<string> rowKeys)
        {
            return rowKeys.Contains(idTown.ToString()) ? await db.TownBuildingPlanSettings.Where(s => s.IdTown == idTown).ExecuteDeleteAsync() : 0;
        }
    }
}
