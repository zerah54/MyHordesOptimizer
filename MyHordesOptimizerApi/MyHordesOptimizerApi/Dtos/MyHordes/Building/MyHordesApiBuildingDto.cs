using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Building
{
    /// <summary>
    /// Sortie de <c>getBuildingPrototypeData</c> : le référentiel <c>/json/buildings</c>, hors
    /// ville. À ne pas confondre avec <c>city.chantiers</c> / <c>city.buildings</c>, qui passent
    /// par <c>getChantiersData</c> et portent les valeurs ajustées à la configuration de la ville.
    /// </summary>
    public class MyHordesApiBuildingDto
    {
        [JsonProperty("id")]
        [JsonPropertyName("id")]
        public int? Id { get; set; }

        [JsonProperty("img")]
        [JsonPropertyName("img")]
        public string? Img { get; set; }

        [JsonProperty("name")]
        [JsonPropertyName("name")]
        public IDictionary<string, string>? Name { get; set; }

        [JsonProperty("desc")]
        [JsonPropertyName("desc")]
        public IDictionary<string, string>? Desc { get; set; }

        [JsonProperty("pa")]
        [JsonPropertyName("pa")]
        public int? Pa { get; set; }

        [JsonProperty("maxLife")]
        [JsonPropertyName("maxLife")]
        public int? MaxLife { get; set; }

        [JsonProperty("breakable")]
        [JsonPropertyName("breakable")]
        public bool? Breakable { get; set; }

        [JsonProperty("def")]
        [JsonPropertyName("def")]
        public int? Def { get; set; }

        [JsonProperty("hasUpgrade")]
        [JsonPropertyName("hasUpgrade")]
        public bool? HasUpgrade { get; set; }

        [JsonProperty("rarity")]
        [JsonPropertyName("rarity")]
        public int? Rarity { get; set; }

        [JsonProperty("temporary")]
        [JsonPropertyName("temporary")]
        public bool? Temporary { get; set; }

        [JsonProperty("parent")]
        [JsonPropertyName("parent")]
        public int? Parent { get; set; }

        [JsonProperty("resources")]
        [JsonPropertyName("resources")]
        public List<MyHordesApiBuildingRessource>? Resources { get; set; }

        /// <summary>
        /// Ordre d'affichage officiel du jeu (<c>BuildingPrototype::getOrderBy</c>). Seul champ à
        /// contenu propre que MHO ne demande pas encore : le brancher relève du chantier E, qui
        /// exige une colonne sur la table <c>Building</c>.
        /// </summary>
        [JsonProperty("order")]
        public int? Order { get; set; }

        /// <summary>
        /// Vaut <c>0</c> EN DUR sur ce endpoint. La difficulté réelle n'existe que sur
        /// <c>city.chantiers</c>, où elle vient de <c>Building::getDifficultyLevel</c>.
        /// </summary>
        [JsonProperty("difficulty")]
        public int? Difficulty { get; set; }

        /// <summary>
        /// Alias strict de <see cref="Pa"/> sur ce endpoint : <c>case "pa": case "paCurrent":</c>
        /// partagent la même expression. Ne porte une valeur distincte que sur
        /// <c>city.chantiers</c>, où c'est le coût en PA ajusté à la rareté de la ville.
        /// </summary>
        [JsonProperty("paCurrent")]
        public int? PaCurrent { get; set; }

        /// <summary>
        /// Alias strict de <see cref="Rarity"/> sur ce endpoint. Voir <see cref="PaCurrent"/>.
        /// </summary>
        [JsonProperty("rarityCurrent")]
        public int? RarityCurrent { get; set; }

        /// <summary>
        /// Alias strict de <see cref="Resources"/> sur ce endpoint. Voir <see cref="PaCurrent"/>.
        /// </summary>
        [JsonProperty("resourcesCurrent")]
        public List<MyHordesApiBuildingRessource>? ResourcesCurrent { get; set; }
    }
}
