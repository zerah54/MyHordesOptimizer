using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status
{
    public class UpdateGhoulStatusDto
    {
        [JsonProperty("isGhoul")]
        public bool IsGhoul { get; set; }

        [JsonProperty("voracity")]
        public int Voracity { get; set; }
    }
}
