using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using System.Collections.Generic;
using System.ComponentModel;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class ItemRecipe
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public bool IsShamanOnly { get; set; }
        public List<ItemResult> Result { get; set; }
        public List<Item> Components { get; set; }
        public IDictionary<string, string> Actions { get; set; }

        public ItemRecipe()
        {
            Actions = new Dictionary<string, string>();
            Components = new List<Item>();
            Result = new List<ItemResult>();
        }
    }

    public enum ItemRecipeType
    {
        [Description("Workshop")]
        Workshop,
        [Description("Manual")]
        Manual,
        [Description("Kitchen")]
        Kitchen,
        [Description("Labo")]
        Labo
    }
}
