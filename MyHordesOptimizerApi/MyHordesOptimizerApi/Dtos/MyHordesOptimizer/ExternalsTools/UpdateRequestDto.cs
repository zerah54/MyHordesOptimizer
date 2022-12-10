using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using Newtonsoft.Json;
using System.Collections.Generic;

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
    }
}
