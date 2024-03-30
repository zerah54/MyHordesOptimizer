using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Extensions
{
    public static class DbContextExtensions
    {
        public static void Patch<T>(this MhoContext dbContext, ICollection<T> fromDbEntities, ICollection<T> updatedEntities, IEqualityComparer<T> comparer) where T : class
        {
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
            dbContext.SaveChanges();
        }
    }
}
