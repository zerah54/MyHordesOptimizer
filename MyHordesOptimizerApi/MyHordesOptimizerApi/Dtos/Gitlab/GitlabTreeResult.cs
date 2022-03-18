using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.Gitlab
{
    public class GitlabTreeResult
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("type")]
        public string Type { get; set; }

        [JsonProperty("path")]
        public string Path { get; set; }

        [JsonProperty("mode")]
        public string Mode { get; set; }
    }
}
