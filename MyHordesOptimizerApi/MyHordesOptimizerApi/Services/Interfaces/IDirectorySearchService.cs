using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Search;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IDirectorySearchService
    {
        /// <summary>
        /// Joueurs et villes dont le nom contient la saisie : début du nom, puis début d'un mot, puis
        /// le reste. Vide sous <c>DirectorySearchService.MinQueryLength</c> caractères.
        /// </summary>
        DirectorySearchResultDto Search(string? query, int? limit);
    }
}
