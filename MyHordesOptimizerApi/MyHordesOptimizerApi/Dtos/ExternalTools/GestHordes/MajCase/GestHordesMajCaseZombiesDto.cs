using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.MajCase
{
    public class GestHordesMajCaseZombiesDto
    {
        [JsonProperty("userKey")]
        public string UserKey { get; set; }

        [JsonProperty("idMap")]
        public int IdMap { get; set; }

        [JsonProperty("x")]
        public int X { get; set; }

        [JsonProperty("y")]
        public int Y { get; set; }

        [JsonProperty("nbrKill")]
        public int NbrKill { get; set; }
    }
}
