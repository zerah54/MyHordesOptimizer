﻿using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class StackableItemDto
    {
        public ItemDto Item { get; set; }
        public bool IsBroken { get; set; }
        public int Count { get; set; }
        public int WishListCount { get; set; }
    }
}
