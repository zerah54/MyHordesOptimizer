using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations
{
    public class EstimationResultDto
    {

        [JsonProperty("result")] public EstimationValueDto Result { get; set; } = new EstimationValueDto();

        [JsonProperty("minList")] public List<int> minList { get; set; } = new List<int>();

        [JsonProperty("maxList")] public List<int> maxList { get; set; } = new List<int>();
    }
}
