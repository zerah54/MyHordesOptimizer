﻿namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList
{
    public class WishListPutResquestDto
    {
        public int Id { get; set; }
        public int Priority { get; set; }
        public int ZoneXPa { get; set; }
        public int Depot { get; set; }
        public bool ShouldSignal { get; set; }
        public int Count { get; set; }
    }
}
