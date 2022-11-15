using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes
{
    public class UpdateZoneRegenDto
    {
        [JsonProperty("direction")]
        public string Direction { get; set; }

        [JsonProperty("idMap")]
        public int IdMap { get; set; }

        [JsonProperty("mapNbX")]
        public int MapNbX { get; set; }

        [JsonProperty("mapNbY")]
        public int MapNbY { get; set; }

        [JsonProperty("townX")]
        public int TownX { get; set; }

        [JsonProperty("townY")]
        public int TownY { get; set; }

        [JsonProperty("PHPSESSID")]
        public string PHPSESSID { get; set; }

        [JsonProperty("cells")]
        public List<JsonElement> Cells { get; set; }

        public List<dynamic> DynamicsCells { get; set; }
    }
}
