using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags
{
    public class UpdateBagsContentsDto
    {
        [JsonProperty("userId")]
        public int UserId { get; set; }

        [JsonProperty("objects")]
        public List<UpdateObjectDto> Objects { get; set; }
    }
}
