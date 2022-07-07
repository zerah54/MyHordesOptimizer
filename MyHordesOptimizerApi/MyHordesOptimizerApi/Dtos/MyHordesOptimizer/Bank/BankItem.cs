using MyHordesOptimizerApi.Attributes.Firebase;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class BankItem
    {
        public Item Item { get; set; }
        public bool IsBroken { get; set; }
        public int Count { get; set; }
        [FirebaseSerializeIgnore]
        public int WishListCount { get; set; }
    }
}
