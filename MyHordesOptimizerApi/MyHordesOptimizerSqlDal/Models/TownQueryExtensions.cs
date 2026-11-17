using System.Linq;

namespace MyHordesOptimizerApi.Models;

public static class TownQueryExtensions
{
    /// <summary>Écarte les villes fantômes des pré-villes (traduisible par EF) ; les villes provisoires réelles (IdTown = -mapId) restent.</summary>
    public static IQueryable<Town> ExcludingPreTowns(this IQueryable<Town> towns)
    {
        return towns.Where(town => town.IdTown >= -PreTownIds.Offset);
    }
}
