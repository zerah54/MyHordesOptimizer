using MyHordesOptimizerApi.Attributes.Firebase;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer
{
    public class Item
    {
        public string Uid { get; set; }
        public string Img { get; set; }
        public IDictionary<string, string> Label { get; set; }
        public int Id { get; set; }
        public Category Category { get; set; }
        public int Deco { get; set; }
        public bool IsHeaver { get; set; }
        public int Guard { get; set; }
        public IDictionary<string, string> Description { get; set; }

        public IEnumerable<string> Properties { get; set; }
        public IEnumerable<string> Actions { get; set; }
        [FirebaseSerializeIgnore]
        public List<ItemRecipe> Recipes { get; set; }
        [FirebaseSerializeIgnore]
        public int WishListCount { get; set; }
        [FirebaseSerializeIgnore]
        public int BankCount { get; set; }

        public Item()
        {
            Description = new Dictionary<string, string>();
            Recipes = new List<ItemRecipe>();
        }

        public override bool Equals(object obj)
        {
            return obj is Item item &&
                   Id == item.Id;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Id);
        }
    }

    public class ItemResult
    {
        public double Probability { get; set; }
        public int Weight { get; set; }
        public Item Item { get; set; }

        public override bool Equals(object obj)
        {
            return obj is ItemResult result &&
                   EqualityComparer<Item>.Default.Equals(Item, result.Item);
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Item);
        }
    }
}
