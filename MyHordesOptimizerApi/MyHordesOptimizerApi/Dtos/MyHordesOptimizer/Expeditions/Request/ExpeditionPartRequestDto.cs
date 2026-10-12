using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request
{
    public class ExpeditionPartRequestDto
    {
        public int? Id { get; set; }
        public List<int>? OrdersId { get; set; }
        public List<int>? CitizensId { get; set; }
        public int Position { get; set; }
        /// <summary>Tracé lié : toujours envoyé (null pour délier), la partie reprend cette valeur.</summary>
        public int? MapRouteId { get; set; }
        public string? Label { get; set; }
        public string? Direction { get; set; }
    }
}
