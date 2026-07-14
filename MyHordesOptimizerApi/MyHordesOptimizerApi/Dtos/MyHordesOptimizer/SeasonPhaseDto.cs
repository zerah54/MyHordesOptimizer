namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    /// <summary>
    /// Combinaison saison / phase existant en base, utilisée comme filtre unique côté front.
    /// Phase native ou inconnue est coalescée en NATIVE (affichée « SX » sans suffixe).
    /// </summary>
    public class SeasonPhaseDto
    {
        public int Season { get; set; }
        public TownPhase Phase { get; set; }
        public bool IsFinished { get; set; }
    }
}
