using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Me
{
    public class MyHordesMeResponseDto
    {
        [JsonProperty("id")]
        public int Id { get; set; }
        [JsonProperty("name")]
        public string Name { get; set; }
        [JsonProperty("map")]
        public MyHordesMap Map { get; set; }
        [JsonProperty("job")]
        public MyHordesJob Job { get; set; }
        [JsonProperty("rewards")]
        public List<MyHordesReward> Rewards { get; set; }
    }
}
