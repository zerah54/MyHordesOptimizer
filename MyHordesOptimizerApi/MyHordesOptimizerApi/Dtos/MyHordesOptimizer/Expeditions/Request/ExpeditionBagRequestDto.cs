using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request
{
    public class ExpeditionBagRequestDto
    {
        public int? Id { get; set; }
        public List<ExpeditionBagItemRequestDto> Items { get; set; } = null!;
    }

    public class ExpeditionBagItemRequestDto
    {
        public int Id { get; set; }
        public int Count { get; set; }
    }
}
