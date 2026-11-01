using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Data.Wishlist
{
    public class MyHordesOptimizerDefaultWishlist
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public Dictionary<string,string> Name { get; set; } = null!;

        [JsonProperty("items")]
        public List<MyHordesOptimizerDefaultWishlistItem> Items { get; set; } = null!;

        [JsonProperty("categories")]
        public List<MyHordesOptimizerDefaultWishlistCategory> Categories { get; set; } = null!;
    }
}
