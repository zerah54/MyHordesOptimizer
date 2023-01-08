using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status
{
    public class UpdateSingleStatusDto
    {
        [JsonProperty("userId")]
        public int UserId { get; set; }

        [JsonProperty("status")]
        public List<string> Status { get; set; }
    }
}
