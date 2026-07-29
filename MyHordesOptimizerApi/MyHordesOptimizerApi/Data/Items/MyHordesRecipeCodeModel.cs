using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Data.Items
{
    public class MyHordesRecipeCodeModel
    {
        [JsonProperty("type")]
        public string Type { get; set; }

        [JsonProperty("in")]
        public List<string> In { get; set; }

        [JsonProperty("out")]
        public List<object> Out { get; set; }

        [JsonProperty("action")]
        public string Action { get; set; }

        /// <summary>
        /// Message d'erreur forcé : la recette qui en porte un n'assemble jamais rien.
        /// </summary>
        [JsonProperty("error")]
        public string Error { get; set; }

        [JsonProperty("picto")]
        public string Picto { get; set; }
        [JsonProperty("stealthy")]
        public string Stealthy { get; set; }

        [JsonProperty("provoking")]
        public string Provoking { get; set; }
    }
}
