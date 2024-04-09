using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Data.Heroes
{
    public class MyHordesHerosPowerCodeModel
    {
        [JsonProperty("name")]
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonProperty("unlockable")]
        [JsonPropertyName("unlockable")]
        public bool Unlockable { get; set; }

        [JsonProperty("used")]
        [JsonPropertyName("used")]
        public string Used { get; set; }

        [JsonProperty("replace")]
        [JsonPropertyName("replace")]
        public string Replace { get; set; }
    }
}
