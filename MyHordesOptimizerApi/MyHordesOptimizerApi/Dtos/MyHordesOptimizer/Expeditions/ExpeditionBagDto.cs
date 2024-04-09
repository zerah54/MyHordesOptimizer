using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions
{
    public class ExpeditionBagDto
    {
        public List<StackableItemDto> Items { get; set; }
        public int? Id { get; set; }

        public ExpeditionBagDto()
        {
            Items = new List<StackableItemDto>();
        }
    }
}
