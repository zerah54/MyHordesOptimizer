using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class WishListItemDto
    {
        public ItemDto Item { get; set; }
        public int Count { get; set; }
        public int BankCount { get; set; }
        public int BagCount { get; set; }
        /// <summary>Pseudos des citoyens vivants dont le sac contient l'objet.</summary>
        public List<string> BagCitizens { get; set; } = new List<string>();
        public int Priority { get; set; }
        public int ZoneXPa { get; set; }
        public int Depot { get; set; }
        public bool ShouldSignal { get; set; }
        public bool IsWorkshop { get; set; }
    }
}
