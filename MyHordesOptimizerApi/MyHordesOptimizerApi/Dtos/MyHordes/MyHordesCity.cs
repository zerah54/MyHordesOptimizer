using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesCity
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("water")]
        public int Water { get; set; }

        [JsonProperty("x")]
        public int X { get; set; }

        [JsonProperty("y")]
        public int Y { get; set; }

        [JsonProperty("door")]
        public bool Door { get; set; }

        [JsonProperty("chaos")]
        public bool Chaos { get; set; }

        [JsonProperty("hard")]
        public bool Hard { get; set; }

        [JsonProperty("devast")]
        public bool Devast { get; set; }
    }
}
