using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Town
{
    public class MyHordesTownCityFieldsDto
    {
        [JsonProperty("type")] public string? Type { get; set; }
        [JsonProperty("chaos")] public bool Chaos { get; set; }
        [JsonProperty("devast")] public bool Devast { get; set; }
        [JsonProperty("door")] public bool Door { get; set; }
        [JsonProperty("water")] public int Water { get; set; }
        [JsonProperty("x")] public int X { get; set; }
        [JsonProperty("y")] public int Y { get; set; }
    }
}
