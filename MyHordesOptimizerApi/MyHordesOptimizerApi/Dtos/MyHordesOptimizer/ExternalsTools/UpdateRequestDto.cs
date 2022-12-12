using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public class UpdateRequestDto
    {
        [JsonProperty("map")]
        public UpdateRequestMapDto Map { get; set; }
        [JsonProperty("bags")]
        public UpdateBagsRequestDto Bags { get; set; }
        [JsonProperty("townDetails")]
        public UpdateTownDetailsDto TownDetails { get; set; }
        [JsonProperty("heroicActions")]
        public UpdateHeroicActionsDto HeroicActions { get; set; }
        [JsonProperty("amelios")]
        public UpdateHomeDto Amelios { get; set; }
        [JsonProperty("status")]
        public UpdateStatusDto Status { get; set; }
    }
}
