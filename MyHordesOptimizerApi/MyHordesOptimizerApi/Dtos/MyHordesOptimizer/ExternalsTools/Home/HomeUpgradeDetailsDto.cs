using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home
{
    public class HomeUpgradeDetailsDto
    {
        [JsonProperty("kitchen")]
        public int Kitchen { get; set; }

        [JsonProperty("house")]
        public int House { get; set; }

        [JsonProperty("alarm")]
        public int Alarm { get; set; }

        [JsonProperty("chest")]
        public int Chest { get; set; }

        [JsonProperty("curtain")]
        public int Curtain { get; set; }

        [JsonProperty("defense")]
        public int Defense { get; set; }

        [JsonProperty("fence")]
        public int Fence { get; set; }

        [JsonProperty("lab")]
        public int Lab { get; set; }

        [JsonProperty("lock")]
        public int Lock { get; set; }

        [JsonProperty("rest")]
        public int Rest { get; set; }
    }
}
