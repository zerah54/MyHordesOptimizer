using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesBuilding
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("icon")]
        public string Icon { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("desc")]
        public string Desc { get; set; }

        [JsonProperty("pa")]
        public int Pa { get; set; }

        [JsonProperty("breakable")]
        public bool Breakable { get; set; }

        [JsonProperty("def")]
        public int Def { get; set; }

        [JsonProperty("temporary")]
        public bool Temporary { get; set; }
    }
}