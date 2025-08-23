using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.FataMorgana
{
    public class FataMorganaScavRadarDto
    {
        [JsonProperty("north")]
        [JsonPropertyName("north")]
        public bool? North { get; set; }

        [JsonProperty("west")]
        [JsonPropertyName("west")]
        public bool? West { get; set; }

        [JsonProperty("south")]
        [JsonPropertyName("south")]
        public bool? South { get; set; }

        [JsonProperty("east")]
        [JsonPropertyName("east")]
        public bool? East { get; set; }
    }
}
