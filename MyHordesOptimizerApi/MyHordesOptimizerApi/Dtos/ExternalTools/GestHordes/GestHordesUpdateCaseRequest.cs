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
        [JsonProperty("dataObjet[0][idObjet]")]
        public int IdPelle => 5001;
        [JsonProperty("dataObjet[0][nbr]")]
        public int NbrPelle => 1;
        [JsonProperty("dataObjet[0][type]")]
        public int TypePelle => 4;
        
    }
}
