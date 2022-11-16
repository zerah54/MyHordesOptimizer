using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public class UpdateCellInfoDto
    {
        [JsonProperty("x")]
        public int X { get; set; }
        [JsonProperty("y")]
        public int Y { get; set; }
        [JsonProperty("townId")]
        public int TownId { get; set; }
        [JsonProperty("townX")]
        public int TownX { get; set; }
        [JsonProperty("townY")]
        public int TownY { get; set; }
        [JsonProperty("zombies")]
        public int Zombies { get; set; }
        [JsonProperty("deadZombies")]
        public int DeadZombies { get; set; }
        [JsonProperty("zoneEmpty")]
        public bool ZoneEmpty { get; set; }
        [JsonProperty("isDevaste")]
        public bool IsDevaste { get; set; }

        [JsonProperty("objects")]
        public List<UpdateCellObjectDto> Objects { get; set; }
    }
}
