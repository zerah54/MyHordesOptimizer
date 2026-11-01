using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Data.Items
{
    public class MyHordesRecipeCodeModel
    {
        [JsonProperty("type")]
        public string Type { get; set; } = null!;

        [JsonProperty("in")]
        public List<string> In { get; set; } = null!;

        [JsonProperty("out")]
        public List<object> Out { get; set; } = null!;

        [JsonProperty("action")]
        public string Action { get; set; } = null!;

        /// <summary>
        /// Message d'erreur forcé : la recette qui en porte un n'assemble jamais rien.
        /// </summary>
        [JsonProperty("error")]
        public string Error { get; set; } = null!;

        [JsonProperty("picto")]
        public string Picto { get; set; } = null!;
        [JsonProperty("stealthy")]
        public string Stealthy { get; set; } = null!;

        [JsonProperty("provoking")]
        public string Provoking { get; set; } = null!;
    }
}
