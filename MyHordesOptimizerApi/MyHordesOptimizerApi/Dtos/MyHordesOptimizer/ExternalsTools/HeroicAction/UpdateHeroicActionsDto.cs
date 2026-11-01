using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction
{
    public class UpdateHeroicActionsDto
    {
        [JsonProperty("toolsToUpdate")]
        public UpdateRequestToolsToUpdateDetailsDto ToolsToUpdate { get; set; } = null!;
        [JsonProperty("actions")]
        public List<ActionHeroicDto> Actions { get; set; } = null!;
    }
}
