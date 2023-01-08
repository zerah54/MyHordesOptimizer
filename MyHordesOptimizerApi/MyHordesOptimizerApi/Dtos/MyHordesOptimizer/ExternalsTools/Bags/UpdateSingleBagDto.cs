using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags
{
    public class UpdateSingleBagDto
    {
        [JsonProperty("userId")]
        public int UserId { get; set; }

        [JsonProperty("objects")]
        public List<UpdateObjectDto> Objects { get; set; }
    }
}
