using MyHordesOptimizerApi.Dtos.MyHordes;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class Town
    {
        public int Id { get; set; }

        public MyHordesMap MyHordesMap { get; set; }

        public Dictionary<string, Citizen> Citizens { get; set; }

        public Dictionary<string, BankItem> Bank { get; set; }
    }
}
