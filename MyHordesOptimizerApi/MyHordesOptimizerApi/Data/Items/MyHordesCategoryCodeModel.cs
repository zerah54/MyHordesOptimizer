using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.Items
{
    public class MyHordesCategoryCodeModel
    {
        [JsonProperty("name")]
        public string Name { get; set; } = null!;

        [JsonProperty("label")]
        public string Label { get; set; } = null!;

        [JsonProperty("parent")]
        public object Parent { get; set; } = null!;

        [JsonProperty("ordering")]
        public int Ordering { get; set; }
    }
}
