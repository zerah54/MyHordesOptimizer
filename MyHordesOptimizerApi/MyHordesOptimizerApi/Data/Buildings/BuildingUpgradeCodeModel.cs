using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Data.Buildings
{
    /// <summary>
    /// Évolutions d'un chantier (Data/Buildings/upgrades.json, produit par l'extracteur) : niveau maximum, textes traduits
    /// et valeurs par niveau relevées dans le code du jeu.
    /// </summary>
    public class BuildingUpgradeCodeModel
    {
        [JsonProperty("maxLevel")]
        [JsonPropertyName("maxLevel")]
        public int MaxLevel { get; set; }

        /// <summary>Absent pour un chantier dont seul le code du jeu lit le niveau.</summary>
        [JsonProperty("texts")]
        [JsonPropertyName("texts")]
        public BuildingUpgradeTextsCodeModel? Texts { get; set; }

        /// <summary>Nom de l'effet (nom dans le code du jeu) → valeurs ; absent sans effet chiffré.</summary>
        [JsonProperty("effects")]
        [JsonPropertyName("effects")]
        public Dictionary<string, BuildingUpgradeEffectCodeModel>? Effects { get; set; }
    }

    public class BuildingUpgradeTextsCodeModel
    {
        /// <summary>Texte de base, par langue (de, fr, en, es).</summary>
        [JsonProperty("base")]
        [JsonPropertyName("base")]
        public Dictionary<string, string>? Base { get; set; }

        /// <summary>Un texte par niveau (premier élément = niveau 1), par langue.</summary>
        [JsonProperty("levels")]
        [JsonPropertyName("levels")]
        public List<Dictionary<string, string>> Levels { get; set; } = new();
    }

    public class BuildingUpgradeEffectCodeModel
    {
        /// <summary>Valeur à chaque niveau, du niveau 0 au niveau maximum ; nulle quand le jeu la calcule.</summary>
        [JsonProperty("levels")]
        [JsonPropertyName("levels")]
        public List<double?> Levels { get; set; } = new();

        [JsonProperty("default")]
        [JsonPropertyName("default")]
        public double? Default { get; set; }

        /// <summary>Fichier du jeu où la valeur est écrite.</summary>
        [JsonProperty("source")]
        [JsonPropertyName("source")]
        public string Source { get; set; } = "";
    }
}
