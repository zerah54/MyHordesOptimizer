using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class BankLastUpdateDto
    {
        public List<BankItemDto> Bank { get; set; }
        public LastUpdateInfoDto LastUpdateInfo { get; set; }

        public BankLastUpdateDto()
        {
            Bank = new List<BankItemDto>();
        }
    }
}
