using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions
{
    public class ExpeditionBagDto
    {
        public List<StackableItemDto> Items { get; set; }
        public int? Id { get; set; }
        public List<int> ExpeditionsId { get; set; }
        public List<int> ExpeditionsCitizenId { get; set; }
        public List<int> ExpeditionsPartId { get; set; }

        public ExpeditionBagDto()
        {
            Items = new List<StackableItemDto>();
            ExpeditionsCitizenId = new List<int>();
            ExpeditionsPartId = new List<int>();
            ExpeditionsId = new List<int>();
        }
    }
}
