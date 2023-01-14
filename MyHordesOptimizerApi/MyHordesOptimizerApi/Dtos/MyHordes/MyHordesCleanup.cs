using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesCleanup
    {
        [JsonProperty("user")]
        public string User { get; set; }

        [JsonProperty("type")]
        public string Type { get; set; }
    }
}
