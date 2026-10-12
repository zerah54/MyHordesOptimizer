namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens
{
    /// <summary>Campings déjà effectués par un citoyen dans la ville (0 à <see cref="MaxCampingCount"/>).</summary>
    public class CitizenCampingCountDto
    {
        public const int MaxCampingCount = 100;

        public int CampingCount { get; set; }
    }
}
