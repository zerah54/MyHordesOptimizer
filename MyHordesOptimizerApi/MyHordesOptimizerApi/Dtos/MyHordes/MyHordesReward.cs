using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesReward
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("rare")]
        public int Rare { get; set; }

        [JsonProperty("number")]
        public int Number { get; set; }

        [JsonProperty("img")]
        public string Img { get; set; }

        [JsonProperty("name")]
        public MyHordesLangString Name { get; set; }

        [JsonProperty("desc")]
        public MyHordesLangString Desc { get; set; }

        [JsonProperty("titles")]
        public List<MyHordesLangString> Titles { get; set; }
    }
}