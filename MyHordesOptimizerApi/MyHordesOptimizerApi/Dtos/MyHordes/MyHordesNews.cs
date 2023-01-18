using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesNews
    {
        [JsonProperty("z")]
        public int Z { get; set; }

        [JsonProperty("def")]
        public int Def { get; set; }

        [JsonProperty("content")]
        public MyHordesLangString Content { get; set; }

        [JsonProperty("water")]
        public int Water { get; set; }

        [JsonProperty("regenDir")]
        public MyHordesLangString RegenDir { get; set; }

    }
}
