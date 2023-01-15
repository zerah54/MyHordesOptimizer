using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Digs
{
    public class UpdateSuccesDigValueDto
    {
        [JsonProperty("citizenId")]
        public int CitizenId { get; set; }

        [JsonProperty("successDigs")]
        public int SuccessDigs { get; set; }

        [JsonProperty("totalDigs")]
        public int TotalDigs { get; set; }
    }
}
