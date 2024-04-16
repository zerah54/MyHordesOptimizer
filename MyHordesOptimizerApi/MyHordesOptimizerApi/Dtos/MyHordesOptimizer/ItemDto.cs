using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer
{
    public class ItemDto : ItemWithoutRecipeDto
    {
        public List<ItemRecipeDto> Recipes { get; set; }

        public ItemDto() : base()
        {
            Recipes = new List<ItemRecipeDto>();
        }
    }
}
