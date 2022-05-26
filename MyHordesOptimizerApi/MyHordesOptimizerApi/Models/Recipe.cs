using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models
{
    public class Recipe
    {
        public int IdRecipe { get; set; }
        public List<Item> Results { get; set; }
        public List<Item> Components { get; set; }
        public bool IsShamanOnly { get; set; }
        public string ActionFr { get; set; }
        public string ActionEn { get; set; }
        public string ActionDe { get; set; }
        public string ActionEs { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }

    }
}
