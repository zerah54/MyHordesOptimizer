using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class BankWrapper
    {
        public List<BankItem> Bank { get; set; }
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public BankWrapper()
        {
            Bank = new List<BankItem>();
        }
    }
}
