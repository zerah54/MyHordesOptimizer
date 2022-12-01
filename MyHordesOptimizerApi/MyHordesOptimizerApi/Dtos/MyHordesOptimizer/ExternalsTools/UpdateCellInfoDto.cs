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
        [JsonProperty("zombies")]
        public int Zombies { get; set; }
        [JsonProperty("deadZombies")]
        public int DeadZombies { get; set; }
        [JsonProperty("zoneEmpty")]
        public bool ZoneEmpty { get; set; }


        [JsonProperty("objects")]
        public List<UpdateObjectDto> Objects { get; set; }
    }
}
