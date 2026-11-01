using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.ZenHordes
{
    /// <summary>Radar de l'Éclaireur : estimation du nombre de zombies sur la case voisine.</summary>
    public class ZenHordesScoutRadarDto
    {
        [JsonProperty("north", NullValueHandling = NullValueHandling.Ignore)]
        public int? North { get; set; }

        [JsonProperty("east", NullValueHandling = NullValueHandling.Ignore)]
        public int? East { get; set; }

        [JsonProperty("south", NullValueHandling = NullValueHandling.Ignore)]
        public int? South { get; set; }

        [JsonProperty("west", NullValueHandling = NullValueHandling.Ignore)]
        public int? West { get; set; }
    }
}
