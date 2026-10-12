namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes
{
    /// <summary>Partie d'expédition liée à un tracé.</summary>
    public class MapRouteLinkedPartDto
    {
        public int ExpeditionId { get; set; }
        public int PartId { get; set; }
        public int? Day { get; set; }
        public string? ExpeditionLabel { get; set; }
        public int PartPosition { get; set; }
    }
}
