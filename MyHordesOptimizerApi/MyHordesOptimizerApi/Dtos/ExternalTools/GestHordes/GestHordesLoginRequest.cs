using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes
{
    public class GestHordesLoginRequest
    {
        [JsonProperty("key")]
        public string Key { get; set; }
    }
}
