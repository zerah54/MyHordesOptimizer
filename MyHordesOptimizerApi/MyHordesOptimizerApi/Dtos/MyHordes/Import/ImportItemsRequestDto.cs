using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Import
{
    public class ImportItemsRequestDto
    {
        [JsonProperty("ItemsProperties")]
        public string ItemsProperties { get; set; }

        [JsonProperty("Recipes")]
        public string Recipes { get; set; }

        [JsonProperty("ItemActions")]
        public string ItemActions { get; set; }

        [JsonProperty("en")]
        public string En { get; set; }

        [JsonProperty("fr")]
        public string Fr { get; set; }

        [JsonProperty("es")]
        public string Es { get; set; }
    }
}
