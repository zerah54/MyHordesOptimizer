using MyHordesOptimizerApi.Dtos.MyHordes;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class Town
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("myHordesMap")]
        public MyHordesMap MyHordesMap { get; set; }
    }
}
