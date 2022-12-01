using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public class UpdateBagDto
    {
        [JsonProperty("userId")]
        public int UserId { get; set; }

        [JsonProperty("objects")]
        public List<UpdateObjectDto> Objects { get; set; }
    }
}
