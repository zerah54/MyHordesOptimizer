using MyHordesOptimizerApi.Models.Import;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>
    /// Capture de la vérité de MyHordes sur les villes suspectes (réponse brute de /json/towns),
    /// avant la migration des clés. N'écrit que dans TownRankingSnapshot et TownRankingSnapshotCitizen.
    /// </summary>
    public interface ITownSnapshotService
    {
        /// <summary>
        /// Interroge MyHordes par lots de 50. Sans <paramref name="refresh"/>, les villes déjà
        /// capturées sont ignorées ; avec, elles sont réinterrogées et leurs citoyens remplacés.
        /// <paramref name="onlyRankingIds"/> restreint la capture à ces identifiants (s'ils sont candidats).
        /// </summary>
        Task CaptureAsync(bool refresh, IReadOnlyCollection<int>? onlyRankingIds, Action<ImportStepProgress>? onStep);

        /// <summary>Une classe par ville (la première qui s'applique), clés négatives exclues.</summary>
        IReadOnlyList<(int RankingId, string SuspectClass)> SelectCandidates();
    }
}
