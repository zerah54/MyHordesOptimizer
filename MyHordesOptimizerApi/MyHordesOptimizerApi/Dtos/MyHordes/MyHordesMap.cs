using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesMap
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("city")]
        public MyHordesCity City { get; set; }

        [JsonProperty("citizens")]
        public List<MyHordesCitizen> Citizens { get; set; }

        [JsonProperty("wid")]
        public int Wid { get; set; }

        [JsonProperty("hei")]
        public int Hei { get; set; }

        [JsonProperty("conspiracy")]
        public bool Conspiracy { get; set; }

        public LastUpdateInfo LastUpdateInfo { get; set; }
    }
}
