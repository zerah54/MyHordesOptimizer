using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class BankLastUpdate
    {
        public List<BankItem> Bank { get; set; }
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public BankLastUpdate()
        {
            Bank = new List<BankItem>();
        }
    }
}
