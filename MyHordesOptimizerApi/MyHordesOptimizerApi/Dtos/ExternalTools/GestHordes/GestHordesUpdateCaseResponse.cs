using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes
{
    public class GestHordesUpdateCaseResponse
    {
        [JsonProperty("codeRetour")]
        public int CodeRetour { get; set; }

        [JsonProperty("libRetour")]
        public string LibRetour { get; set; }

        [JsonProperty("zoneRetour")]
        public string ZoneRetour { get; set; }
    }
}
