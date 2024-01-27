using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using System.Collections.Generic;
using System.ComponentModel;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class ItemRecipeDto
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public List<ItemResultDto> Result { get; set; }
        public List<ItemDto> Components { get; set; }
        public IDictionary<string, string> Actions { get; set; }

        public ItemRecipeDto()
        {
            Actions = new Dictionary<string, string>();
            Components = new List<ItemDto>();
            Result = new List<ItemResultDto>();
        }
    }
}
