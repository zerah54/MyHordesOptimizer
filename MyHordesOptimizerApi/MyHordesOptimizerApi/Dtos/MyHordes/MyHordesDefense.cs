using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>Détail de la défense de la ville, sortie de <c>getDefenseData</c>.</summary>
    public class MyHordesDefense
    {
        [JsonProperty("total")]
        public int? Total { get; set; }

        [JsonProperty("base")]
        public int? Base { get; set; }

        [JsonProperty("buildings")]
        public int? Buildings { get; set; }

        [JsonProperty("upgrades")]
        public int? Upgrades { get; set; }

        /// <summary>Défense apportée par les objets, avant multiplicateur.</summary>
        [JsonProperty("items")]
        public int? Items { get; set; }

        /// <summary>Multiplicateur appliqué à <see cref="Items"/>.</summary>
        [JsonProperty("itemsMul")]
        public double? ItemsMul { get; set; }

        [JsonProperty("citizenHomes")]
        public int? CitizenHomes { get; set; }

        [JsonProperty("citizenGuardians")]
        public int? CitizenGuardians { get; set; }

        [JsonProperty("watchmen")]
        public int? Watchmen { get; set; }

        [JsonProperty("souls")]
        public int? Souls { get; set; }

        /// <summary>Défense temporaire, valable une seule nuit.</summary>
        [JsonProperty("temp")]
        public int? Temp { get; set; }

        [JsonProperty("cadavers")]
        public int? Cadavers { get; set; }

        /// <summary>
        /// Bonus multiplicatif de défense, en FLOTTANT et non en entier : MyHordes renvoie
        /// <c>1 - overall_scale</c>, donc une fraction négative (ex. <c>-0.13</c> pour +13 %).
        /// Émis uniquement si <c>overall_scale &gt; 1</c>, donc absent quand la ville n'a aucun
        /// bonus.
        /// </summary>
        [JsonProperty("bonus")]
        public double? Bonus { get; set; }

        [JsonProperty("guardiansInfos")]
        public MyHordesGuardiansInfos? GuardiansInfos { get; set; }
    }
}
