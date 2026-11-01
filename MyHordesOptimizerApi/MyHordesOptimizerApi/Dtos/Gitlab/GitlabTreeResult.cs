using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.Gitlab
{
    public class GitlabTreeResult
    {
        [JsonProperty("id")]
        public string Id { get; set; } = null!;

        [JsonProperty("name")]
        public string Name { get; set; } = null!;

        [JsonProperty("type")]
        public string Type { get; set; } = null!;

        [JsonProperty("path")]
        public string Path { get; set; } = null!;

        [JsonProperty("mode")]
        public string Mode { get; set; } = null!;
    }
}
