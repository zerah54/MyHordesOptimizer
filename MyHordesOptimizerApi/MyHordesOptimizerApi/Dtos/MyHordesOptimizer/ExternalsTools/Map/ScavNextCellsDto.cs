using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map
{
    public class ScavNextCellsDto
    {
        [JsonProperty("north")]
        [JsonPropertyName("north")]
        public bool North { get; set; }

        [JsonProperty("south")]
        [JsonPropertyName("south")]
        public bool South { get; set; }

        [JsonProperty("east")]
        [JsonPropertyName("east")]
        public bool East { get; set; }

        [JsonProperty("west")]
        [JsonPropertyName("west")]
        public bool West { get; set; }
    }
}
