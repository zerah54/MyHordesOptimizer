using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping
{
    public class CampingGroupResultDto
    {
        /// <summary>Chances de chaque campeur, dans l'ordre demandé.</summary>
        public List<CampingOddsDto> Odds { get; set; } = new();

        /// <summary>Survivants attendus dans l'ordre demandé (somme des chances bornées).</summary>
        public double ExpectedSurvivors { get; set; }

        /// <summary>
        /// Ordre de cachette qui maximise les survivants attendus : indices des campeurs demandés, du
        /// premier caché au dernier. À égalité, celui qui laisse le plus de campeurs à leur place.
        /// </summary>
        public List<int> BestOrder { get; set; } = new();

        /// <summary>Survivants attendus dans <see cref="BestOrder"/>.</summary>
        public double BestExpectedSurvivors { get; set; }
    }
}
