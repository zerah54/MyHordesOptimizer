using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map
{
    public class ScoutNextCellsDto
    {
        [JsonProperty("north")]
        [JsonPropertyName("north")]
        public int? North { get; set; }

        [JsonProperty("south")]
        [JsonPropertyName("south")]
        public int? South { get; set; }

        [JsonProperty("east")]
        [JsonPropertyName("east")]
        public int? East { get; set; }

        [JsonProperty("west")]
        [JsonPropertyName("west")]
        public int? West { get; set; }
    }
}
