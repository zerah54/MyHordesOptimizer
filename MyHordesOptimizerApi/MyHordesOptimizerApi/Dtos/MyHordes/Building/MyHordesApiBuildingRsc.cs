using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Building
{
    public class MyHordesApiBuildingRsc
    {
        [JsonProperty("id")]
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonProperty("uid")]
        [JsonPropertyName("uid")]
        public string Uid { get; set; }
    }
}
