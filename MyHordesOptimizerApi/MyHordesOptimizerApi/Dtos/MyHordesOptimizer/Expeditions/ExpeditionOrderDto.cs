using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions
{
    public class ExpeditionOrderDto
    {
        public int? Id { get; set; }
        public string? Type { get; set; }
        public string? Text { get; set; }
        public bool? IsDone { get; set; }
        public int? Position { get; set; }
        public int? ExpeditionCitizenId { get; set; }
        public List<int> ExpeditionPartsId { get; set; }
        public List<int> ExpeditionsId { get; set; }
    }
}
