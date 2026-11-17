using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.PreTowns;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>Pré-villes : espace de préparation d'une ville avant son lancement, adossé à une ville fantôme.</summary>
    public interface IPreTownService
    {
        Task<PreTownDto> CreateAsync(string alias);
        /// <summary>Réservé aux organisateurs de la source ; la copie reprend le contenu, pas les membres.</summary>
        Task<PreTownDto> DuplicateAsync(int preTownId, string alias);
        Task<List<PreTownSummaryDto>> ListMineAsync();
        Task<PreTownDto> GetAsync(int preTownId);
        Task AddMemberAsync(int preTownId, int idUser);
        Task RemoveMemberAsync(int preTownId, int idUser);
        Task SetOrganizerAsync(int preTownId, int idUser, bool isOrganizer);
        Task RenameAsync(int preTownId, string alias);
        /// <summary>Règle le nombre de citoyens simulés (organisateurs, pré-ville non liée, 1 à 40).</summary>
        Task SetSimulatedCitizensAsync(int preTownId, int simulatedCitizens);
        Task MarkSeenAsync(int preTownId);
    }
}
