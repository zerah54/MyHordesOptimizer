using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map
{
    public class UpdateCellInfoDto
    {
        [JsonProperty("x")]
        public int X { get; set; }
        [JsonProperty("y")]
        public int Y { get; set; }
        [JsonProperty("zombies")]
        public int? Zombies { get; set; }
        [JsonProperty("deadZombies")]
        public int? DeadZombies { get; set; }
        [JsonProperty("zoneEmpty")]
        public bool? ZoneEmpty { get; set; }


        [JsonProperty("objects")]
        public List<UpdateObjectDto>? Objects { get; set; }
        [JsonProperty("citizenId")]
        public List<int>? CitizenId { get; set; }

        /// <summary>Radar du Fouineur sur les cases adjacentes. true = la case voisine est épuisée.</summary>
        [JsonProperty("scavNextCells")]
        public ScavNextCellsDto? ScavNextCells { get; set; }

        /// <summary>Radar de l'Éclaireur sur les cases adjacentes : estimation bruitée du nombre de zombies.</summary>
        [JsonProperty("scoutNextCells")]
        public ScoutNextCellsDto? ScoutNextCells { get; set; }

        /// <summary>Niveau d'abondance (0-3) de la case courante, relevé par un Fouineur. 0 = zone épuisée.</summary>
        [JsonProperty("scavZoneLevel")]
        [JsonPropertyName("scavZoneLevel")]
        public int? ScavZoneLevel { get; set; }

        /// <summary>Niveau d'exploration (0-3) de la case courante, relevé par un Éclaireur.</summary>
        [JsonProperty("scoutZoneLvl")]
        [JsonPropertyName("scoutZoneLvl")]
        public int? ScoutZoneLvl { get; set; }
    }
}
