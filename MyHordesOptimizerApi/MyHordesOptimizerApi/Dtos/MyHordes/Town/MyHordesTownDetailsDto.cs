using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Town
{
    public class MyHordesTownDetailsDto : MyHordesTownListItemDto
    {
        [JsonProperty("citizens")]
        public List<MyHordesTownCitizenDto>? Citizens { get; set; }
    }

    public class MyHordesTownCitizenDto
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("twinId")]
        public int? TwinId { get; set; }

        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("avatar")]
        public string? Avatar { get; set; }

        [JsonProperty("survival")]
        public int? Survival { get; set; }

        [JsonProperty("score")]
        public int? Score { get; set; }

        [JsonProperty("dtype")]
        public int? Dtype { get; set; }

        [JsonProperty("msg")]
        public string? Msg { get; set; }

        [JsonProperty("comment")]
        public string? Comment { get; set; }
    }
}
