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

        [JsonProperty("scavNextCells")]
        public ScavNextCellsDto? ScavNextCells { get; set; }

        [JsonProperty("scoutNextCells")]
        public ScoutNextCellsDto? ScoutNextCells { get; set; }

        [JsonProperty("scoutZoneLvl")]
        [JsonPropertyName("scoutZoneLvl")]
        public int? ScoutZoneLvl { get; set; }
    }
}
