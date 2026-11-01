using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.ZenHordes
{
    /// <summary>
    /// Corps de <c>POST /update</c> de ZenHordes. Les champs optionnels sont omis quand ils sont absents :
    /// ZenHordes les valide avec Zod, qui refuse un <c>null</c>.
    /// </summary>
    public class ZenHordesUpdateRequestDto
    {
        /// <summary>Clé MyHordes du joueur.</summary>
        [JsonProperty("key")]
        public string Key { get; set; } = null!;

        [JsonProperty("townId")]
        public int TownId { get; set; }

        [JsonProperty("userId")]
        public int UserId { get; set; }

        /// <summary>Position relative à la ville, telle qu'affichée par le jeu.</summary>
        [JsonProperty("x")]
        public int X { get; set; }

        [JsonProperty("y")]
        public int Y { get; set; }

        [JsonProperty("zombies", NullValueHandling = NullValueHandling.Ignore)]
        public int? Zombies { get; set; }

        [JsonProperty("depleted", NullValueHandling = NullValueHandling.Ignore)]
        public bool? Depleted { get; set; }

        [JsonProperty("scoutRadar", NullValueHandling = NullValueHandling.Ignore)]
        public ZenHordesScoutRadarDto? ScoutRadar { get; set; }

        [JsonProperty("scavRadar", NullValueHandling = NullValueHandling.Ignore)]
        public ZenHordesScavRadarDto? ScavRadar { get; set; }

        [JsonProperty("items", NullValueHandling = NullValueHandling.Ignore)]
        public List<ZenHordesItemDto>? Items { get; set; }
    }
}
