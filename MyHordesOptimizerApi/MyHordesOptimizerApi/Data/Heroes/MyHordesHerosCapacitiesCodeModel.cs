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

        /// <summary>
        /// MyHordes a renommé « daysNeeded » en « unlockAt ». Le champ « action » a disparu
        /// du référentiel amont ; rien ne le lisait.
        /// </summary>
        [JsonProperty("unlockAt")]
        public int UnlockAt { get; set; }

        [JsonProperty("legacy")]
        public bool Legacy { get; set; }
    }
}
