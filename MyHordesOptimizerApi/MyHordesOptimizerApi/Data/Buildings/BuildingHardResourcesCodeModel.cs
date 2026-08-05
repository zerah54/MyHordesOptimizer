using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Data.Buildings
{
    public class BuildingHardResourcesCodeModel
    {
        [JsonProperty("tier0")]
        [JsonPropertyName("tier0")]
        public BuildingResourceTierCodeModel Tier0 { get; set; }

        [JsonProperty("tier1")]
        [JsonPropertyName("tier1")]
        public BuildingResourceTierCodeModel Tier1 { get; set; }

        [JsonProperty("tier2")]
        [JsonPropertyName("tier2")]
        public BuildingApOnlyTierCodeModel Tier2 { get; set; }

        /// <summary>
        /// Rareté effective en Pandémonium, exposée SEULEMENT quand le chantier est nommément
        /// overridé dans rules.yml (voir Projections::normaliserPaliersPandemonium côté extracteur).
        /// Absente pour les chantiers qui ne relèvent que de la règle générique.
        /// </summary>
        [JsonProperty("rareteEffective")]
        [JsonPropertyName("rareteEffective")]
        public int? RareteEffective { get; set; }
    }

    public class BuildingResourceTierCodeModel
    {
        [JsonProperty("resources")]
        [JsonPropertyName("resources")]
        public Dictionary<string, int> Resources { get; set; }

        [JsonProperty("ap")]
        [JsonPropertyName("ap")]
        public int Ap { get; set; }
    }

    public class BuildingApOnlyTierCodeModel
    {
        [JsonProperty("ap")]
        [JsonPropertyName("ap")]
        public int Ap { get; set; }
    }
}
