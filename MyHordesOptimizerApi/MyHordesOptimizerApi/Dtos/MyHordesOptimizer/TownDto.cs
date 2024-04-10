using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class TownDto
    {
        public int Id { get; set; }

        public MyHordesMap MyHordesMap { get; set; }

        public CitizensLastUpdateDto Citizens { get; set; }

        public BankLastUpdateDto Bank { get; set; }

        public CadaversLastUpdateDto Cadavers { get; set; }

        public WishListLastUpdateDto WishList { get; set; }
    }
}
