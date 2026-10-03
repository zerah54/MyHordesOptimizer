using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping
{
    public class CampingOddsDto
    {
        [JsonProperty("probability")]
        public int Probability { get; set; }

        [JsonProperty("boundedProbability")]
        public int BoundedProbability { get; set; }

        [JsonProperty("label")]
        public IDictionary<string, string> Label { get; set; }

        /// <summary>
        /// Contribution de chaque facteur au pourcentage brut, par clé (previous, tomb, town, zone,
        /// zoneBuilding, lighthouse, campItems, zombies, campers, night, distance, devastated).
        /// Leur somme vaut <see cref="Probability"/> : le site affiche le détail du calcul sans
        /// en dupliquer la formule.
        /// </summary>
        [JsonProperty("details")]
        public IDictionary<string, int> Details { get; set; }
    }
}
