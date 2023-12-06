using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping
{
    public class CampingResultDto
    {
        [JsonProperty("probability")]
        public int Probability { get; set; }

        [JsonProperty("strict")]
        public bool Strict { get; set; }

        [JsonProperty("label")]
        public IDictionary<string, string> Label { get; set; }
    }
}
