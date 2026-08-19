using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Chest
{
    public class UpdateSingleChestDto
    {
        [JsonProperty("userId")]
        public int UserId { get; set; }

        [JsonProperty("objects")]
        public List<UpdateObjectDto> Objects { get; set; }
    }
}
