using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map
{
    public class MyHordesOptimizerCellUpdateDto
    {
        [JsonProperty("isDryed")]
        public bool IsDryed { get; set; }

        [JsonProperty("nbZombie")]
        public int NbZombie { get; set; }

        [JsonProperty("nbZombieKilled")]
        public int NbZombieKilled { get; set; }

        [JsonProperty("isRuinCamped")]
        public bool? IsRuinCamped { get; set; }

        [JsonProperty("items")]
        public List<UpdateObjectDto> Items { get; set; }

        [JsonProperty("citizens")]
        public List<int> Citizens { get; set; }

        [JsonProperty("note")]
        public string? Note { get; set; }
        [JsonProperty("x")]
        public int X { get; set; }
        [JsonProperty("y")]
        public int Y { get; set; }

        /// <summary>Niveau d'abondance de la zone (0-3) saisi manuellement. 0 = zone épuisée.</summary>
        [JsonProperty("scavZoneLevel")]
        public int? ScavZoneLevel { get; set; }

        /// <summary>Niveau d'exploration de la zone (0-3) saisi manuellement.</summary>
        [JsonProperty("scoutZoneLevel")]
        public int? ScoutZoneLevel { get; set; }

        /// <summary>Radar du Fouineur saisi depuis cette case. true = la case voisine est épuisée.</summary>
        [JsonProperty("scavNextCells")]
        public ScavNextCellsDto? ScavNextCells { get; set; }

        /// <summary>Radar de l'Éclaireur saisi depuis cette case : estimation de zombies par direction.</summary>
        [JsonProperty("scoutNextCells")]
        public ScoutNextCellsDto? ScoutNextCells { get; set; }
    }
}
