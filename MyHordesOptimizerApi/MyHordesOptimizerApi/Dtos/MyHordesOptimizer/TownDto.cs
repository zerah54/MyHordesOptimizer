using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class TownDto
    {
        public int Id { get; set; }

        public MyHordesMap MyHordesMap { get; set; } = null!;

        public CitizensLastUpdateDto Citizens { get; set; } = null!;

        public BankLastUpdateDto? Bank { get; set; }

        public CadaversLastUpdateDto? Cadavers { get; set; }

        public WishListLastUpdateDto WishList { get; set; } = null!;
    }
}
