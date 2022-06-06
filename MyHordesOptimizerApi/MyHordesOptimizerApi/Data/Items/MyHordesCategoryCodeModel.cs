using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.Items
{
    public class MyHordesCategoryCodeModel
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("label")]
        public string Label { get; set; }

        [JsonProperty("parent")]
        public object Parent { get; set; }

        [JsonProperty("ordering")]
        public int Ordering { get; set; }
    }
}
