using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class TownListItemDto
    {
        public int Id { get; set; }
        public int? MapId { get; set; }
        public string? Name { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public TownType? TownType { get; set; }
        public int? Season { get; set; }
        public TownPhase? Phase { get; set; }
        public string? Language { get; set; }
        public int? Score { get; set; }
        public bool IsChaos { get; set; }
        public bool IsDevasted { get; set; }
        public bool IsFinished { get; set; }
        public List<TownPublicCitizenSimpleDto> Citizens { get; set; } = new();
    }
}