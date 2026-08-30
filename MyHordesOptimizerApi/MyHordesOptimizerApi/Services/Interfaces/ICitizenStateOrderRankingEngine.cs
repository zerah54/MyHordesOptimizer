using System.Collections.Generic;
using MyHordesOptimizerApi.Models.CitizenState;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ICitizenStateOrderRankingEngine
    {
        /// <summary>
        /// Classe tous les ordres de consommation distincts du sac (dédupliqués par multiset), du
        /// plus optimisé (gravité la plus faible) au pire, sur un modèle de trajet à budget de
        /// distance nominal (voir <see cref="CitizenStateOrderRankingEngine"/>).
        /// </summary>
        List<RankedOrder> RankOrders(CitizenState startingState, IReadOnlyList<int> bagItemIds);
    }
}
