namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList
{
    public class WishListGroupDto
    {
        public string Uid { get; set; } = null!;
        public string Name { get; set; } = null!;
        public int Priority { get; set; }
        public int ZoneXPa { get; set; }
        public int Depot { get; set; }
        public int Count { get; set; }
    }
}
