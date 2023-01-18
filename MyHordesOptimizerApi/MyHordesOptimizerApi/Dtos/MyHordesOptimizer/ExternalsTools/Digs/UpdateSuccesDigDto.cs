using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Digs
{
    public class UpdateSuccesDigDto
    {
        [JsonProperty("cell")]
        public UpdateSuccesDigCellDto Cell { get; set; }

        [JsonProperty("values")]
        public List<UpdateSuccesDigValueDto> Values { get; set; }
    }
}
