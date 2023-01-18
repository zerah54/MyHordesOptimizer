using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesChantier
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("icon")]
        public string Icon { get; set; }

        [JsonProperty("name")]
        public MyHordesLangString Name { get; set; }

        [JsonProperty("desc")]
        public MyHordesLangString Desc { get; set; }

        [JsonProperty("pa")]
        public int Pa { get; set; }

        [JsonProperty("maxLife")]
        public int MaxLife { get; set; }

        [JsonProperty("votes")]
        public int Votes { get; set; }

        [JsonProperty("breakable")]
        public bool Breakable { get; set; }

        [JsonProperty("def")]
        public int Def { get; set; }

        [JsonProperty("temporary")]
        public bool Temporary { get; set; }

        [JsonProperty("resources")]
        public List<MyHordesResourceRoot> Resources { get; set; }

        [JsonProperty("actions")]
        public int Actions { get; set; }

        [JsonProperty("hasLevels")]
        public int HasLevels { get; set; }
    }
}
