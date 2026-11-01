using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home
{
    public class UpdateHomeDto
    {
        [JsonProperty("toolsToUpdate")]
        public UpdateRequestToolsToUpdateDetailsDto ToolsToUpdate { get; set; } = null!;
        [JsonProperty("values")]
        public HomeUpgradeDetailsDto Values { get; set; } = null!;
    }
}
