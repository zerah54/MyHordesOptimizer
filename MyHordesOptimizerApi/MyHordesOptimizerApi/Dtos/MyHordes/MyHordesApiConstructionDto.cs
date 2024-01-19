using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesApiConstructionDto
    {
        [JsonProperty("id")] public int Id { get; set; }

        [JsonProperty("name")] public IDictionary<string, string> Name { get; set; }

        [JsonProperty("desc")] public IDictionary<string, string> Desc { get; set; }

        [JsonProperty("img")] public string Img { get; set; }

        [JsonProperty("pa")] public int Pa { get; set; }

        [JsonProperty("maxLife")] public int MaxLife { get; set; }

        [JsonProperty("breakable")] public bool Breakable { get; set; }

        [JsonProperty("def")] public int Def { get; set; }

        [JsonProperty("hasUpgrade")] public bool HasUpgrade { get; set; }

        [JsonProperty("rarity")] public int Rarity { get; set; }

        [JsonProperty("temporary")] public bool Temporary { get; set; }

        [JsonProperty("parent")] public int Parent { get; set; }

        [JsonProperty("resources")] public int Resources { get; set; }
    }
}
