using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request
{
    public class ExpeditionPartRequestDto
    {
        public int? Id { get; set; }
        public List<int>? OrdersId { get; set; }
        public List<int>? CitizensId { get; set; }
        public string? Path { get; set; }
        public string? Label { get; set; }
        public string? Direction { get; set; }
    }
}
