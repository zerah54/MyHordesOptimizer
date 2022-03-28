using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes
{
    public class GestHordesMajRequest
    {
        [JsonProperty("userKey")]
        public string Key { get; set; }
    }
}
