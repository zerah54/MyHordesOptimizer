using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>Lignes ajoutées (clés pour le journal de rattachement) et lignes source ignorées car déjà présentes dans la ville cible.</summary>
    public record MergeReport(IReadOnlyList<string> AddedRowKeys, int Skipped);

    /// <summary>
    /// Fusion additive des données de planification d'une table, de la ville fantôme vers la vraie ville.
    /// Ne modifie jamais une ligne existante de la ville cible ; sauvegarde elle-même (ids générés), sans ouvrir de transaction.
    /// </summary>
    public interface IPreTownMerger
    {
        /// <summary>Nom SQL exact de la table, utilisé pour supprimer les lignes journalisées au détachement.</summary>
        string TableName { get; }

        /// <summary>Rang d'exécution à la liaison/duplication (ordre inverse au détachement) ; les rangs égaux gardent l'ordre d'enregistrement.</summary>
        int Order => 100;

        Task<MergeReport> MergeAsync(MhoContext db, int fromIdTown, int toIdTown);

        /// <summary>Supprime exactement les lignes journalisées de la ville cible ; une ligne déjà absente est ignorée. Retourne le nombre supprimé.</summary>
        Task<int> RemoveAsync(MhoContext db, int idTown, IReadOnlyList<string> rowKeys);
    }
}
