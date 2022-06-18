using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Items
{
    public class MyHordesItem
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public IDictionary<string, string> Label { get; set; }

        [JsonProperty("img")]
        public string Img { get; set; }

        [JsonProperty("cat")]
        public IDictionary<string, string> Category { get; set; }

        [JsonProperty("heavy")]
        public bool Heavy { get; set; }

        [JsonProperty("deco")]
        public int Deco { get; set; }

        [JsonProperty("guard")]
        public int Guard { get; set; }

        [JsonProperty("desc")]
        public IDictionary<string, string> Description { get; set; }
    }
}
