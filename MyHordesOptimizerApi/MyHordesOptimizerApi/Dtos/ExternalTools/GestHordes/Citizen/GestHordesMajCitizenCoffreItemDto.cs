using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen
{
    public class GestHordesMajCitizenCoffreItemDto
    {
        [JsonProperty("idObjet")]
        public int IdObjet { get; set; }

        [JsonProperty("nbre")]
        public int Nbre { get; set; }

        [JsonProperty("casse")]
        public bool Casse { get; set; }
    }
}
