using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesZone
    {
        [JsonProperty("x")]
        public int X { get; set; }

        [JsonProperty("y")]
        public int Y { get; set; }

        [JsonProperty("nvt")]
        public int Nvt { get; set; }

        [JsonProperty("details")]
        public dynamic Details { get; set; }

        [JsonProperty("danger")]
        public int? Danger { get; set; }

        [JsonProperty("building")]
        public MyHordesRuin Building { get; set; }

        [JsonProperty("items")]
        public List<MyHordesZoneItem> Items { get; set; }
    }
}
