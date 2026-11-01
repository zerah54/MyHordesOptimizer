using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.ZenHordes
{
    /// <summary>Radar du Fouineur : true = la case voisine est épuisée.</summary>
    public class ZenHordesScavRadarDto
    {
        [JsonProperty("north", NullValueHandling = NullValueHandling.Ignore)]
        public bool? North { get; set; }

        [JsonProperty("east", NullValueHandling = NullValueHandling.Ignore)]
        public bool? East { get; set; }

        [JsonProperty("south", NullValueHandling = NullValueHandling.Ignore)]
        public bool? South { get; set; }

        [JsonProperty("west", NullValueHandling = NullValueHandling.Ignore)]
        public bool? West { get; set; }
    }
}
