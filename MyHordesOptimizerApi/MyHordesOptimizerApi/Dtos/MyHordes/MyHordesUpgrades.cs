using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesUpgradesRoot
    {
        [JsonProperty("total")]
        public int Total { get; set; }

        [JsonProperty("list")]
        public List<MyHordesUpgrade> List { get; set; }
    }
}
