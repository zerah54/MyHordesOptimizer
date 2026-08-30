using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models.CitizenState
{
    /// <summary>Un ordre de consommation possible du sac, avec la gravité qu'il atteint.</summary>
    public class RankedOrder
    {
        public List<int> Order { get; set; } = new();
        public CitizenStateSeverityTier Tier { get; set; }

        /// <summary>
        /// Distance nominale cumulée (PA+PE de départ + PA/PE des consommables) à laquelle <see cref="Tier"/>
        /// a été atteint pour la première fois — départage les ex-æquo de même tier (le plus tardif gagne).
        /// Null si Tier == None (jamais atteint).
        /// </summary>
        public int? TierReachedAtDistance { get; set; }

        /// <summary>Distance nominale cumulée totale parcourue par cet ordre — arrêtée à la mort si <see cref="Tier"/> == Dead.</summary>
        public int TotalDistance { get; set; }

        public CitizenState FinalState { get; set; } = null!;
    }
}
