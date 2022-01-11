using MyHordesOptimizerApi.Attributes.Firebase;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer
{
    public class Item
    {
        public string JsonIdName { get; set; }
        public string Img { get; set; }
        public IDictionary<string, string> Label { get; set; }
        public int XmlId { get; set; }
        public string Category { get; set; }
        public int Deco { get; set; }
        public bool IsHeaver { get; set; }
        public int Guard { get; set; }
        public string XmlName { get; set; }
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
    }

    public class ItemResult
    {
        public double Probability { get; set; }
        public int Weight { get; set; }
        public Item Item { get; set; }
    }
}
