using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Chest
{
    public class UpdateChestDto
    {
        [JsonProperty("toolsToUpdate")]
        public UpdateRequestToolsToUpdateDetailsDto ToolsToUpdate { get; set; }

        [JsonProperty("contents")]
        public List<UpdateObjectDto> Contents { get; set; }
    }
}
