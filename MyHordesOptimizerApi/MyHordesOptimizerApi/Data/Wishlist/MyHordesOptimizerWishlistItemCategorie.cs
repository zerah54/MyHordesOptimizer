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
        public List<int> Items { get; set; }
    }
}
