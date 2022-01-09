using MyHordesOptimizerApi.Dtos.MyHordes;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class Town
    {
        public int Id { get; set; }

        public MyHordesMap MyHordesMap { get; set; }

        public CitizensWrapper Citizens { get; set; }

        public BankWrapper Bank { get; set; }
    }
}
