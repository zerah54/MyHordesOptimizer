using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesApiRuinDto
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public IDictionary<string, string> Name { get; set; }

        [JsonProperty("desc")]
        public IDictionary<string, string> Desc { get; set; }

        [JsonProperty("explorable")]
        public bool Explorable { get; set; }

        [JsonProperty("img")]
        public string Img { get; set; }
    }
}
