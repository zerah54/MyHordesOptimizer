using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Data.Ruins
{
    public class MyHordesRuinCodeModel
    {
        [JsonProperty("label")]
        public string Label { get; set; }

        [JsonProperty("icon")]
        public string Icon { get; set; }

        [JsonProperty("camping")]
        public int Camping { get; set; }

        [JsonProperty("min_dist")]
        public int MinDist { get; set; }

        [JsonProperty("max_dist")]
        public int MaxDist { get; set; }

        [JsonProperty("chance")]
        public int Chance { get; set; }

        [JsonProperty("drops")]
        public IDictionary<string, int> Drops { get; set; }

        [JsonProperty("desc")]
        public string Desc { get; set; }
    }
}
