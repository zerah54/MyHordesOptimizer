using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class BankWrapper
    {
        public Dictionary<string, BankItem> Bank { get; set; }
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public BankWrapper()
        {
            Bank = new Dictionary<string, BankItem>();
        }
    }
}
