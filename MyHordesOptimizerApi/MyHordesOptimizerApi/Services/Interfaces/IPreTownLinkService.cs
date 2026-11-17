using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.PreTowns;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>Rattachement d'une pré-ville à la ville réelle de l'utilisateur, et détachement dans le délai imparti.</summary>
    public interface IPreTownLinkService
    {
        /// <summary>Compte ce que la liaison ajouterait et ignorerait, sans rien enregistrer.</summary>
        Task<LinkPreviewDto> PreviewAsync(int preTownId);

        Task<LinkResultDto> LinkAsync(int preTownId);

        Task UnlinkAsync(int preTownId);
    }
}
