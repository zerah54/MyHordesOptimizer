﻿using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using System.Collections.Generic;
using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class ItemResultDto
    {
        public double Probability { get; set; }
        public int Weight { get; set; }
        public ItemWithoutRecipeDto Item { get; set; }

        public override bool Equals(object obj)
        {
            return obj is ItemResultDto result &&
                   EqualityComparer<ItemWithoutRecipeDto>.Default.Equals(Item, result.Item);
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Item);
        }
    }
}
