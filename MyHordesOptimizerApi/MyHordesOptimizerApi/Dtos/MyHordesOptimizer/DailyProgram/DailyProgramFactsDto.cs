using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.DailyProgram
{
    /// <summary>Faits bruts du jour pour l'appelant ; l'éligibilité se décide côté client.</summary>
    public class DailyProgramFactsDto
    {
        public bool IsCitizen { get; set; }
        public bool HasEffectivePlan { get; set; }
        public bool IsPlaced { get; set; }
        public List<ExpeditionCitizenDto> OpenPlaces { get; set; } = new();
        public CitizenDto? Me { get; set; }
    }
}
