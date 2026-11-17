using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers
{
    /// <summary>Ajoute les notes dont l'auteur n'en a pas déjà une dans la ville cible (unicité SQL auteur + ville).</summary>
    public class NoteMerger : IPreTownMerger
    {
        public string TableName => "TownNote";

        public async Task<MergeReport> MergeAsync(MhoContext db, int fromIdTown, int toIdTown)
        {
            var sources = await db.TownNotes.AsNoTracking().Where(n => n.IdTown == fromIdTown).OrderBy(n => n.IdTownNote).ToListAsync();
            var authors = (await db.TownNotes.AsNoTracking().Where(n => n.IdTown == toIdTown).Select(n => n.IdUserAuthor).ToListAsync()).ToHashSet();
            var copies = sources.Where(n => !authors.Contains(n.IdUserAuthor))
                .Select(n => new TownNote { IdTown = toIdTown, IdUserAuthor = n.IdUserAuthor, Note = n.Note, UpdatedAt = n.UpdatedAt }).ToList();
            db.TownNotes.AddRange(copies);
            await db.SaveChangesAsync();
            return new MergeReport(copies.Select(c => c.IdTownNote.ToString()).ToList(), sources.Count - copies.Count);
        }

        public async Task<int> RemoveAsync(MhoContext db, int idTown, IReadOnlyList<string> rowKeys)
        {
            var ids = rowKeys.Select(k => int.TryParse(k, out var id) ? id : (int?)null).Where(id => id.HasValue).Select(id => id!.Value).ToList();
            return await db.TownNotes.Where(p => p.IdTown == idTown && ids.Contains(p.IdTownNote)).ExecuteDeleteAsync();
        }
    }
}
