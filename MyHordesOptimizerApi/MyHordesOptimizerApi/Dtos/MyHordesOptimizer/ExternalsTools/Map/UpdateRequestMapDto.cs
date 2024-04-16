using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map
{
    public class UpdateRequestMapDto
    {
        [JsonProperty("cell")]
        public UpdateCellInfoDto? Cell { get; set; }
        [JsonProperty("toolsToUpdate")]
        public UpdateRequestMapToolsToUpdateDetailsDto ToolsToUpdate { get; set; }
    }
}
