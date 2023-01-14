using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesResourceRoot
    {
        [JsonProperty("amount")]
        public int Amount { get; set; }

        [JsonProperty("rsc")]
        public MyHordesResource Rsc { get; set; }
    }
}
