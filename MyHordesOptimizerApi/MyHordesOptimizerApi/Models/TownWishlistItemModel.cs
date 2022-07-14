namespace MyHordesOptimizerApi.Models
{
    public class TownWishlistItemModel
    {
        public int IdTown { get; set; }
        public int IdItem { get; set; }
        public int Count { get; set; }
        public int Depot { get; set; }
        public int Priority { get; set; }
    }
}
