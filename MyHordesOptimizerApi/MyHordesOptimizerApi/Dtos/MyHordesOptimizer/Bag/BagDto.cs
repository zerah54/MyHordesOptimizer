using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Bag
{
    public class BagDto
    {
        public List<StackableItemDto> Items { get; set; }
        public int? IdBag { get; set; }

        public LastUpdateInfoDto LastUpdateInfo { get; set; }

        public BagDto()
        {
            Items = new List<StackableItemDto>();
        }
    }
}
