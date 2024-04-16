using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer
{
    public class ItemWithoutRecipeDto
    {
        public string Uid { get; set; }
        public string Img { get; set; }
        public IDictionary<string, string> Label { get; set; }
        public int Id { get; set; }
        public CategoryDto Category { get; set; }
        public int Deco { get; set; }
        public bool IsHeaver { get; set; }
        public int Guard { get; set; }
        public IDictionary<string, string> Description { get; set; }

        public IEnumerable<string> Properties { get; set; }
        public IEnumerable<string> Actions { get; set; }
        public int WishListCount { get; set; }
        public int BankCount { get; set; }

        public double DropRatePraf { get; set; }
        public double DropRateNotPraf { get; set; }

        public ItemWithoutRecipeDto()
        {
            Description = new Dictionary<string, string>();
        }

        public override bool Equals(object obj)
        {
            return obj is ItemDto item &&
                   Id == item.Id;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Id);
        }
    }
}
