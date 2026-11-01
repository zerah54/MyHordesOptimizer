using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.CauseOfDeath
{
    public class MyHordesCauseOfDeathModel
    {
        [JsonProperty("dtype")]
        public string Dtype { get; set; } = null!;

        [JsonProperty("ref")]
        public string Ref { get; set; } = null!;

        [JsonProperty("label")]
        public string Label { get; set; } = null!;

        [JsonProperty("desc")]
        public string Description { get; set; } = null!;

        [JsonProperty("icon")]
        public string Icon { get; set; } = null!;
    }
}
