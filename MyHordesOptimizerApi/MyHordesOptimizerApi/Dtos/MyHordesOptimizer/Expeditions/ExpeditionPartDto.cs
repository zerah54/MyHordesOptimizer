using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions
{
    public class ExpeditionPartDto
    {
        public int? Id { get; set; }
        public List<ExpeditionOrderDto>? Orders { get; set; }
        public List<ExpeditionCitizenDto>? Citizens { get; set; }
        public string? Path { get; set; }
        public string? Label { get; set; }
        public string? Direction { get; set; }
    }
}
