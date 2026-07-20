using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Me
{
    // Une entrée de l'historique des villes d'un joueur (champ `playedMaps` du /me), càd une vie
    // passée : la ville est donc TERMINÉE sans ambiguïté. Exposé via getCadaversInformation côté
    // MyHordes, d'où la disponibilité de type/score (score = score de la ville) que /json/towns ne
    // porte pas au niveau ville. Pas de townId réel ici : seul le mapId est fourni.
    public class MyHordesPlayedMapDto
    {
        [JsonProperty("mapId")]
        public int? MapId { get; set; }

        [JsonProperty("mapName")]
        public string? MapName { get; set; }

        [JsonProperty("season")]
        public int? Season { get; set; }

        [JsonProperty("phase")]
        public string? Phase { get; set; }

        [JsonProperty("score")]
        public int? Score { get; set; }

        [JsonProperty("type")]
        public string? Type { get; set; }

        [JsonProperty("day")]
        public int? Day { get; set; }

        // Pictos gagnés par le joueur dans cette ville, indexés par idPicto. Coûteux côté MyHordes
        // (une requête SQL par ville) : n'est demandé que par l'import de pictos, à la demande.
        [JsonProperty("rewards")]
        [JsonConverter(typeof(CadaverRewardsConverter))]
        public IDictionary<string, MyHordesCadaverReward>? Rewards { get; set; }
    }
}
