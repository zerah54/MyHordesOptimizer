using Newtonsoft.Json.Converters;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    /// <summary>
    /// Effet catapulte réel d'un objet — devenir précis (intact/cassé/transformé/détruit) et, pour
    /// les objets utilisables comme armes, l'effet de zone (kills ou répulsion) avec son rayon.
    /// Remplace l'ancienne propriété booléenne <c>fragile</c>.
    /// </summary>
    public class CatapultEffectDto
    {
        public CatapultFate Fate { get; set; }

        /// <summary>Renseigné seulement si <see cref="Fate"/> vaut <see cref="CatapultFate.Transformed"/>.</summary>
        public ItemSummaryDto MorphTarget { get; set; }

        public int? KillMin { get; set; }
        public int? KillMax { get; set; }

        /// <summary>Renseigné seulement pour une variante de répulsion sans mise à mort.</summary>
        public int? RepelSeconds { get; set; }

        /// <summary>Renseigné si <see cref="KillMin"/> ou <see cref="RepelSeconds"/> l'est.</summary>
        public CatapultRadius? Radius { get; set; }
    }

    [Newtonsoft.Json.JsonConverter(typeof(StringEnumConverter))]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum CatapultFate
    {
        Intact,
        Broken,
        Transformed,
        Destroyed,
    }

    /// <summary>Valeurs = <c>zombieKillRange</c>/<c>escapeRange</c> du jeu (0/1/2), pas une redérivation.</summary>
    [Newtonsoft.Json.JsonConverter(typeof(StringEnumConverter))]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum CatapultRadius
    {
        Target = 0,
        Cross = 1,
        Square = 2,
    }
}
