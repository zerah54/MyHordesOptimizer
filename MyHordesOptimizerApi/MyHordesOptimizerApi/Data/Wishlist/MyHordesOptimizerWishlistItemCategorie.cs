using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Data.Wishlist
{
    public class MyHordesOptimizerWishlistItemCategorie
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public Dictionary<string,string> Name { get; set; }

        [JsonProperty("items")]
        /// <summary>Identités MyHordes des objets de la catégorie — voir le commentaire ci-dessus.</summary>
        public List<string> Items { get; set; }
    }
}
