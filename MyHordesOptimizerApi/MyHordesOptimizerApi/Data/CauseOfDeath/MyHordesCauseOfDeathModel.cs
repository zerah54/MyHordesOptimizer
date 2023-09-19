using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.CauseOfDeath
{
    public class MyHordesCauseOfDeathModel
    {
        [JsonProperty("dtype")]
        public string Dtype { get; set; }

        [JsonProperty("ref")]
        public string Ref { get; set; }

        [JsonProperty("label")]
        public string Label { get; set; }

        [JsonProperty("desc")]
        public string Description { get; set; }

        [JsonProperty("icon")]
        public string Icon { get; set; }
    }
}
