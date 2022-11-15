using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.Items
{
    public class MyHordesItemDropCodeModel
    {
        [JsonProperty("item")]
        public string ItemUid { get; set; }
        [JsonProperty("count")]
        public int Weight { get; set; }
    }
}
