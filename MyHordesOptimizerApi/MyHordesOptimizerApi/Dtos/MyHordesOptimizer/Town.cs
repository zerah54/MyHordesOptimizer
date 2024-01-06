using MyHordesOptimizerApi.Dtos.MyHordes;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class Town
    {
        public int Id { get; set; }

        public MyHordesMap MyHordesMap { get; set; }

        public CitizensLastUpdate Citizens { get; set; }

        public BankLastUpdate Bank { get; set; }

        public CadaversLastUpdate Cadavers { get; set; }

        public WishListLastUpdate WishList { get; set; }
    }
}
