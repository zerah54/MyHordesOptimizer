using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.MajCase
{
    public class GestHordesMajCaseItemDto
    {
        [JsonProperty("idObjet")]
        public int IdObjet { get; set; }

        [JsonProperty("nombre")]
        public int Nombre { get; set; }

        [JsonProperty("type")]
        public int Type { get; set; }
    }
}
