using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.Wishlist
{
    public class MyHordesOptimizerDefaultWishlistItem
    {
        /// <summary>
        /// Identité MyHordes de l'objet (« table_#00 »), et non son identifiant numérique.
        /// </summary>
        /// <remarks>
        /// Ce fichier est saisi à la main. Il désignait les objets par leur id numérique, qui n'est
        /// qu'un auto-incrément de fixtures côté MyHordes : une renumérotation de leur part aurait
        /// fait pointer chaque entrée sur un autre objet, en silence.
        /// </remarks>
        [JsonProperty("uid")]
        public string Uid { get; set; }

        [JsonProperty("count")]
        public int Count { get; set; }

        [JsonProperty("priority")]
        public int Priority { get; set; }

        [JsonProperty("depot")]
        public int Depot { get; set; }

        [JsonProperty("shouldSignal")]
        public bool ShouldSignal { get; set; }

        public int ZoneXPa { get; set; }
    }
}
