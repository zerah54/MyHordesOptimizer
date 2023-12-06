using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping
{
    public class CampingOddsDto
    {
        [JsonProperty("probability")]
        public int Probability { get; set; }

        [JsonProperty("boundedProbability")]
        public int BoundedProbability { get; set; }

        [JsonProperty("label")]
        public IDictionary<string, string> Label { get; set; }
    }
}
