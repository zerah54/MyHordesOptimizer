using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class AttaqueEstimationRequest
    {
        [JsonProperty("day")]
        public int Day { get; set; }

        [JsonProperty("min")]
        public int Min { get; set; }

        [JsonProperty("max")]
        public int Max { get; set; }  

        [JsonProperty("redSouls")]
        public int RedSouls { get; set; }
    }
}
