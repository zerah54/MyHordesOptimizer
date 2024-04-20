using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Data.Building
{
    public class BuildingCodeModel
    {
        [JsonProperty("watchSurvivalBonus")]
        [JsonPropertyName("watchSurvivalBonus")]
        public int WatchSurvivalBonus { get; set; }

        [JsonProperty("watchSurvivalBonusJob")]
        [JsonPropertyName("watchSurvivalBonusJob")]
        public List<string> WatchSurvivalBonusJob { get; set; }

        [JsonProperty("watchSurvivalBonusUpgradeLevelRequired")]
        [JsonPropertyName("watchSurvivalBonusUpgradeLevelRequired")]
        public int WatchSurvivalBonusUpgradeLevelRequired { get; set; }
    }
}
