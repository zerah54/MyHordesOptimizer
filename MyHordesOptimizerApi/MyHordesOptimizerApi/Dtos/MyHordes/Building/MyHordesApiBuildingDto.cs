using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Building
{
    public class MyHordesApiBuildingDto
    {
        [JsonProperty("id")]
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonProperty("img")]
        [JsonPropertyName("img")]
        public string Img { get; set; }

        [JsonProperty("name")]
        [JsonPropertyName("name")]
        public IDictionary<string, string> Name { get; set; }

        [JsonProperty("desc")]
        [JsonPropertyName("desc")]
        public IDictionary<string, string> Desc { get; set; }

        [JsonProperty("pa")]
        [JsonPropertyName("pa")]
        public int Pa { get; set; }

        [JsonProperty("maxLife")]
        [JsonPropertyName("maxLife")]
        public int MaxLife { get; set; }

        [JsonProperty("breakable")]
        [JsonPropertyName("breakable")]
        public bool Breakable { get; set; }

        [JsonProperty("def")]
        [JsonPropertyName("def")]
        public int Def { get; set; }

        [JsonProperty("hasUpgrade")]
        [JsonPropertyName("hasUpgrade")]
        public bool HasUpgrade { get; set; }

        [JsonProperty("rarity")]
        [JsonPropertyName("rarity")]
        public int Rarity { get; set; }

        [JsonProperty("temporary")]
        [JsonPropertyName("temporary")]
        public bool Temporary { get; set; }

        [JsonProperty("parent")]
        [JsonPropertyName("parent")]
        public int Parent { get; set; }

        [JsonProperty("resources")]
        [JsonPropertyName("resources")]
        public List<MyHordesApiBuildingRessource> Resources { get; set; }


    }
}
