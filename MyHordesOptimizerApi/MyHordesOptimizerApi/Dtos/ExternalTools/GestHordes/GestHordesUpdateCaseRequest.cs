using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes
{
    public class GestHordesUpdateCaseRequest
    {
        [JsonProperty("idMap")]
        public int IdMap { get; set; }
        [JsonProperty("x")]
        public int X { get; set; }
        [JsonProperty("y")]
        public int Y { get; set; }
        [JsonProperty("nbrZombie")]
        public int NbrZombie { get; set; }
        [JsonProperty("epuise")]
        public int Epuise { get; set; }        
    }
}
