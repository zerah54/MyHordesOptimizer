using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Data.Jobs
{
    public class JobCodeModel
    {
        [JsonProperty("baseWatchSurvival")]
        [JsonPropertyName("baseWatchSurvival")]
        public int BaseWatchSurvival { get; set; }
    }
}
