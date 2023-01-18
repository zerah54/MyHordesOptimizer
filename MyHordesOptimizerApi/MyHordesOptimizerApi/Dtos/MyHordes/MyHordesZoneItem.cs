using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesZoneItem
    {
        [JsonProperty("uid")]
        public string Uid { get; set; }

        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("count")]
        public int Count { get; set; }

        [JsonProperty("broken")]
        public bool Broken { get; set; }
    }
}
