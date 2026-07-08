using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    /// <summary>
    /// Une page de la liste des villes. AvailableTypes/AvailableLanguages sont calculés sur
    /// l'ensemble de la combinaison saison/phase (pas seulement la page) afin que les listes
    /// déroulantes de filtres restent complètes malgré la pagination.
    /// </summary>
    public class TownListPageResultDto
    {
        public List<TownListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public List<TownType> AvailableTypes { get; set; } = new();
        public List<string> AvailableLanguages { get; set; } = new();
    }
}
