using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Data.Wishlist
{
    public class MyHordesOptimizerDefaultWishlist
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public Dictionary<string,string> Name { get; set; }

        [JsonProperty("items")]
        public List<MyHordesOptimizerDefaultWishlistItem> Items { get; set; }

        [JsonProperty("categories")]
        public List<MyHordesOptimizerDefaultWishlistCategory> Categories { get; set; }
    }
}
