using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Town
{
    public class MyHordesTownListResponseDto
    {
        [JsonProperty("towns")]
        public List<int> Towns { get; set; } = new();
    }
}
