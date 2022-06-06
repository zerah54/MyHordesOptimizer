using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.Items
{
    public class MyHordesItemCodeModel
    {
        [JsonProperty("label")]
        public string Label { get; set; }

        [JsonProperty("icon")]
        public string Icon { get; set; }

        [JsonProperty("category")]
        public string Category { get; set; }

        [JsonProperty("deco")]
        public int Deco { get; set; }

        [JsonProperty("heavy")]
        public bool Heavy { get; set; }

        [JsonProperty("watchpoint")]
        public int Watchpoint { get; set; }
    }
}
