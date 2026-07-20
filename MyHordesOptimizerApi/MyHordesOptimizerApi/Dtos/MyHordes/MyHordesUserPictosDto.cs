using System.Collections.Generic;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    // Réponse de /json/user pour l'import des pictos d'un joueur : son total (rewards) et le détail
    // par ville de tout son historique (playedMaps.rewards), en un seul appel.
    public class MyHordesUserPictosDto
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        /// <summary>Total du joueur, toutes villes confondues (table PictoRollup côté MyHordes).</summary>
        [JsonProperty("rewards")]
        public List<MyHordesReward>? Rewards { get; set; }

        /// <summary>
        /// Vies passées du joueur, avec les pictos gagnés dans chacune. Ne contient jamais la ville
        /// en cours quand le joueur y est encore vivant : MyHordes l'exclut de playedMaps.
        /// </summary>
        [JsonProperty("playedMaps")]
        public List<MyHordesPlayedMapDto>? PlayedMaps { get; set; }
    }
}
