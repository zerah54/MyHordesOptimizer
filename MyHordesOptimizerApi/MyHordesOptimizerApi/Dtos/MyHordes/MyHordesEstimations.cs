using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesEstimations
    {
        [JsonProperty("days")]
        public int Days { get; set; }

        [JsonProperty("min")]
        public int Min { get; set; }

        [JsonProperty("max")]
        public int Max { get; set; }

        [JsonProperty("maxed")]
        public bool Maxed { get; set; }
    }
}
