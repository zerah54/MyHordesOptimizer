using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public class UpdateTownDetailsDto
    {
        [JsonProperty("townId")]
        public int TownId { get; set; }
        [JsonProperty("townX")]
        public int TownX { get; set; }
        [JsonProperty("townY")]
        public int TownY { get; set; }
        [JsonProperty("isDevaste")]
        public bool IsDevaste { get; set; }
    }
}
