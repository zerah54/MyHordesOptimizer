using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags
{
    public class UpdateBagsRequestDto
    {
        [JsonProperty("contents")]
        public List<UpdateBagsContentsDto> Contents { get; set; }
        [JsonProperty("toolsToUpdate")]
        public UpdateRequestToolsToUpdateDetailsDto ToolsToUpdate { get; set; }
    }
}
