using MyHordesOptimizerApi.Dtos.MyHordes;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class Town
    {
        public int Id { get; set; }

        public MyHordesMap MyHordesMap { get; set; }

        public CitizensWrapper Citizens { get; set; }

        public BankWrapper Bank { get; set; }

        public CadaversWrapper Cadavers { get; set; }

        public WishListWrapper WishList { get; set; }
    }
}
