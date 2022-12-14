using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesLangString
    {
        [JsonProperty("fr")]
        public string Fr;

        [JsonProperty("es")]
        public string Es;

        [JsonProperty("en")]
        public string En;

        [JsonProperty("de")]
        public string De;
    }
}
