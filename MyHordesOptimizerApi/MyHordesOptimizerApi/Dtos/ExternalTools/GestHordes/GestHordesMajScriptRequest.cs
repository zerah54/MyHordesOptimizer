using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes
{
    /// <summary>
    /// Corps JSON de /majScript : la synchro par l'API MyHordes, puis les relevés de la case courante.
    /// Coordonnées absolues ; un relevé absent laisse la valeur connue de Gest'Hordes.
    /// </summary>
    public class GestHordesMajScriptRequest
    {
        [JsonProperty("key")]
        public string Key { get; set; } = null!;

        [JsonProperty("x")]
        public int X { get; set; }

        [JsonProperty("y")]
        public int Y { get; set; }

        /// <summary>Niveau de fouille vu par le Fouineur : 0 épuisée … 3 abondante.</summary>
        [JsonProperty("fouille_lvl", NullValueHandling = NullValueHandling.Ignore)]
        public int? FouilleLvl { get; set; }

        /// <summary>Niveau de balisage vu par l'Éclaireur (0-3).</summary>
        [JsonProperty("balisage_lvl", NullValueHandling = NullValueHandling.Ignore)]
        public int? BalisageLvl { get; set; }

        /// <summary>Estimation de zombies des cases voisines ; une direction à null n'a pas été lue.</summary>
        [JsonProperty("estimation_zombie", NullValueHandling = NullValueHandling.Ignore)]
        public ScoutNextCellsDto? EstimationZombie { get; set; }

        /// <summary>État des cases voisines (true = épuisée) ; une direction à null n'a pas été lue.</summary>
        [JsonProperty("regeneration_zone", NullValueHandling = NullValueHandling.Ignore)]
        public ScavNextCellsDto? RegenerationZone { get; set; }
    }
}
