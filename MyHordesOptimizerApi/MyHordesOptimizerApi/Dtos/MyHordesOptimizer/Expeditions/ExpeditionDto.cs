using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions
{
    public class ExpeditionDto
    {
        public int? Id { get; set; }
        public string State { get; set; }
        public string? Label { get; set; }
        public int? MinPdc { get; set; }
        public List<ExpeditionPartDto>? Parts { get; set; }
    }
}
