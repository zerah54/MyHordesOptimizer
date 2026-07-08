using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    /// <summary>
    /// Paramètres de la liste des villes paginée. Le filtrage, le tri et la pagination
    /// sont faits côté serveur pour ne remonter qu'une page à la fois.
    /// </summary>
    public class TownListQueryDto
    {
        public int? Season { get; set; }
        public TownPhase? Phase { get; set; }

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;

        public string? SortColumn { get; set; }
        public string? SortDirection { get; set; }

        public string? Name { get; set; }
        public string? Id { get; set; }
        public List<TownType>? Types { get; set; }
        public List<string>? Languages { get; set; }
        public List<string>? States { get; set; }

        // Rafraîchissement des villes non terminées via l'API MyHordes : coûteux, déclenché
        // uniquement au changement de combinaison saison/phase, pas à chaque page/tri/filtre.
        public bool Refresh { get; set; }
    }
}
