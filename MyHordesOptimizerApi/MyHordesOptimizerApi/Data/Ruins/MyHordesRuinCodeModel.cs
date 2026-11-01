using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Data.Ruins
{
    public class MyHordesRuinCodeModel
    {
        [JsonProperty("label")]
        public string Label { get; set; } = null!;

        [JsonProperty("icon")]
        public string Icon { get; set; } = null!;

        [JsonProperty("camping")]
        public int Camping { get; set; }

        [JsonProperty("min_dist")]
        public int MinDist { get; set; }

        [JsonProperty("max_dist")]
        public int MaxDist { get; set; }

        [JsonProperty("chance")]
        public int Chance { get; set; }

        [JsonProperty("drops")]
        public IDictionary<string, dynamic[]> Drops { get; set; } = null!;

        [JsonProperty("desc")]
        public string Desc { get; set; } = null!;

        [JsonProperty("capacity")]
        public int Capacity { get; set; }

        [JsonProperty("constructions")]
        public List<int> Constructions { get; set; } = null!;
    }
}
