using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen
{
    public class GestHordesMajCitizenMaisonDto
    {
        [JsonProperty("cuisine")]
        public int Cuisine { get; set; }

        [JsonProperty("labo")]
        public int Labo { get; set; }

        [JsonProperty("cloture")]
        public bool Cloture { get; set; }

        [JsonProperty("cs")]
        public int Cs { get; set; }

        [JsonProperty("renfort")]
        public int Renfort { get; set; }

        [JsonProperty("rangement")]
        public int Rangement { get; set; }
    }
}
