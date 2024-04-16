using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request
{
    public class ExpeditionRequestDto
    {
        public int? Id { get; set; }
        public string State { get; set; }
        public int Position { get; set; }
        public string? Label { get; set; }
        public int? MinPdc { get; set; }
        public List<int>? PartsId { get; set; }
    }
}
