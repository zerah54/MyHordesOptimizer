using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Bag
{
    public class BagDto
    {
        public List<BagItemDto> Items { get; set; }
        public int? IdBag { get; set; }

        public LastUpdateInfo LastUpdateInfo { get; set; }

        public BagDto()
        {
            Items = new List<BagItemDto>();
        }
    }
}
