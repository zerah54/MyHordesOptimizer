using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Extensions
{
    public static class DbContextExtensions
    {
        public static void Patch<T>(this MhoContext dbContext, ICollection<T> fromDbEntities, ICollection<T> updatedEntities, IEqualityComparer<T> comparer = null) where T : class
        {
            ApplyPatch(dbContext, fromDbEntities, updatedEntities, comparer);
            dbContext.SaveChanges();
        }

        /// <summary>
        /// Équivalent async de <see cref="Patch{T}"/>, pour les appels faits sous un verrou (dans une
        /// méthode async déjà entrée dans son <c>await using townLock</c>) : un <c>SaveChanges()</c>
        /// synchrone y immobiliserait un thread du pool pendant l'I/O au lieu de le libérer.
        /// </summary>
        public static async Task PatchAsync<T>(this MhoContext dbContext, ICollection<T> fromDbEntities, ICollection<T> updatedEntities, IEqualityComparer<T> comparer = null) where T : class
        {
            ApplyPatch(dbContext, fromDbEntities, updatedEntities, comparer);
            await dbContext.SaveChangesAsync();
        }

        private static void ApplyPatch<T>(MhoContext dbContext, ICollection<T> fromDbEntities, ICollection<T> updatedEntities, IEqualityComparer<T> comparer) where T : class
        {
            if (comparer == null)
            {
                comparer = EqualityComparerFactory.CreateDefault<T>();
            }
            var toRemove = fromDbEntities.Except(updatedEntities, comparer);
            dbContext.RemoveRange(toRemove);
            var toAdd = updatedEntities.Except(fromDbEntities, comparer);
            dbContext.AddRange(toAdd);
            var toUpdate = fromDbEntities.Intersect(updatedEntities, comparer);
            foreach (var update in toUpdate)
            {
                var updatedEntity = updatedEntities.Where(entity => comparer.Equals(entity, update)).First();
                update.UpdateAllButKeysProperties(updatedEntity);
                dbContext.Update(update);
            }
        }
    }
}
