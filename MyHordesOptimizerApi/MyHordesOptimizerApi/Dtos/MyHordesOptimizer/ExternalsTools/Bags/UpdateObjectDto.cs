using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags
{
    public class UpdateObjectDto
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("count")]
        public int Count { get; set; }

        [JsonProperty("isBroken")]
        public bool IsBroken { get; set; }
    }
}
