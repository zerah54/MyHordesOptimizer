using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.Wishlist
{
    public class MyHordesOptimizerDefaultWishlistItem
    {
        [JsonProperty("itemId")]
        public int ItemId { get; set; }

        [JsonProperty("count")]
        public int Count { get; set; }

        [JsonProperty("priority")]
        public int Priority { get; set; }

        [JsonProperty("depot")]
        public int Depot { get; set; }

        public int ZoneXPa { get; set; }
    }
}
