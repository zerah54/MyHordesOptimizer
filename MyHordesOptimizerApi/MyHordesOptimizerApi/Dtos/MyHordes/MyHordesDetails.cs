using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesDetails
    {
        [JsonProperty("h")]
        public int H { get; set; }

        [JsonProperty("z")]
        public int? Z { get; set; }

        [JsonProperty("dried")]
        public bool? Dried { get; set; }
    }
}
