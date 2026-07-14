using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Town
{
    public class MyHordesTownListItemDto
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("mapId")]
        public int? MapId { get; set; }

        [JsonProperty("mapName")]
        public string? Name { get; set; }

        [JsonProperty("day")]
        public int? Day { get; set; }

        [JsonProperty("language")]
        public string? Language { get; set; }

        [JsonProperty("season")]
        public int? Season { get; set; }

        [JsonProperty("phase")]
        public string? Phase { get; set; }

        [JsonProperty("v1")]
        public int? V1 { get; set; }

        [JsonProperty("score")]
        public int? Score { get; set; }

        [JsonProperty("wid")]
        public int? Wid { get; set; }

        [JsonProperty("hei")]
        public int? Hei { get; set; }

        [JsonProperty("city")]
        public MyHordesTownCityFieldsDto? City { get; set; }
    }
}
