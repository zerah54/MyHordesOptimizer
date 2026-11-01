using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags
{
    public class UpdateBagsRequestDto
    {
        [JsonProperty("contents")]
        public List<UpdateBagsContentsDto> Contents { get; set; } = null!;
        [JsonProperty("toolsToUpdate")]
        public UpdateRequestToolsToUpdateDetailsDto ToolsToUpdate { get; set; } = null!;
    }
}
