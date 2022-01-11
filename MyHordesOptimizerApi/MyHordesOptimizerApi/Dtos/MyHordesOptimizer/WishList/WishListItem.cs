using MyHordesOptimizerApi.Attributes.Firebase;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class WishListItem
    {
        public Item Item { get; set; }
        public int Count { get; set; }
        [FirebaseIgnore]
        public int BankCount { get; set; }
        public int Priority { get; set; }
    }
}
