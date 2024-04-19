using Newtonsoft.Json;
using System.Security.Cryptography;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Building
{
    public class MyHordesApiBuildingRessource
    {
        [JsonProperty("amount")]
        [JsonPropertyName("amount")]
        public int Amount { get; set; }

        [JsonProperty("rsc")]
        [JsonPropertyName("rsc")]
        public MyHordesApiBuildingRsc Rsc { get; set; }
    }
}
