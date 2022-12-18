using Newtonsoft.Json;
using System.Collections.Generic;

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

        [JsonProperty("useDefaultOffsets")]
        public bool UseDefaultOffsets { get; set; }

        [JsonProperty("offsetsMin")]
        public List<int> OffsetsMin { get; set; }

        [JsonProperty("offsetsMax")]
        public List<int> OffsetsMax { get; set; }
    }
}
