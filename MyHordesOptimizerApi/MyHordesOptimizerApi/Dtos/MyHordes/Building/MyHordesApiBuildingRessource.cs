using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Building
{
    /// <summary>Sortie de <c>getResources</c> : une ressource requise par un bâtiment.</summary>
    public class MyHordesApiBuildingRessource
    {
        [JsonProperty("amount")]
        [JsonPropertyName("amount")]
        public int? Amount { get; set; }

        [JsonProperty("rsc")]
        [JsonPropertyName("rsc")]
        public MyHordesApiBuildingRsc? Rsc { get; set; }
    }
}
