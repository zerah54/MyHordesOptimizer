using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Extensions
{
    public static class TownMembersExtensions
    {
        /// <summary>
        /// Nombre d'utilisateurs distincts de <paramref name="userIds"/> qui sont ou ont été citoyens de la ville,
        /// vivants ou morts (TownCitizen ou TownCadaver). Une requête (UNION) sur les clés (idTown, idUser).
        /// </summary>
        public static Task<int> CountTownMembersAsync(this MhoContext dbContext, int idTown, IReadOnlyCollection<int> userIds)
        {
            return dbContext.TownCitizens
                .Where(citizen => citizen.IdTown == idTown && userIds.Contains(citizen.IdUser))
                .Select(citizen => citizen.IdUser)
                .Concat(dbContext.TownCadavers
                    .Where(cadaver => cadaver.IdTown == idTown && userIds.Contains(cadaver.IdUser))
                    .Select(cadaver => cadaver.IdUser))
                .Distinct()
                .CountAsync();
        }
    }
}
