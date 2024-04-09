using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.Heroes
{
    public class MyHordesHerosCapacitiesCodeModel
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("title")]
        public string Title { get; set; }

        [JsonProperty("description")]
        public string Description { get; set; }

        [JsonProperty("icon")]
        public string Icon { get; set; }

        [JsonProperty("daysNeeded")]
        public int DaysNeeded { get; set; }

        [JsonProperty("action")]
        public string Action { get; set; }
    }
}
