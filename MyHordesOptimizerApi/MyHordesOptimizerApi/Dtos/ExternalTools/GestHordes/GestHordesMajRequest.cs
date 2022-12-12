using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes
{
    public class GestHordesMajRequest
    {
        [JsonProperty("key")]
        public string Key { get; set; }
    }
}
