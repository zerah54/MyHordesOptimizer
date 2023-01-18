using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesRuin
    {
        [JsonProperty("type")]
        public int Type { get; set; }

        [JsonProperty("dig")]
        public int Dig { get; set; }

        [JsonProperty("name")]
        public MyHordesLangString Name { get; set; }

        [JsonProperty("desc")]
        public MyHordesLangString Desc { get; set; }

        [JsonProperty("camped")]
        public bool Camped { get; set; } 
        [JsonProperty("dried")]
        public bool Dried { get; set; }
    }
}
