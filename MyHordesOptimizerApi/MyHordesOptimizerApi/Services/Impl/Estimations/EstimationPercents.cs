using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;

namespace MyHordesOptimizerApi.Services.Impl.Estimations
{
    /// <summary>Paliers affichés par la tour de guet (33..100 %) et le planificateur (0..100 %).</summary>
    public static class EstimationPercents
    {
        public static readonly int[] Tdg = { 33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100 };
        public static readonly int[] Planif = { 0, 4, 8, 13, 17, 21, 25, 29, 33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100 };

        /// <summary>Valeur saisie au palier <paramref name="percent"/> (propriété `_{percent}`), null si absente.</summary>
        public static EstimationValueDto? Value(EstimationsDto? estimations, int percent) =>
            estimations is null ? null : typeof(EstimationsDto).GetProperty("_" + percent)?.GetValue(estimations) as EstimationValueDto;

        /// <summary>Palier renseigné le plus haut, null si aucun.</summary>
        public static int? HighestFilled(EstimationsDto? estimations, int[] percents)
        {
            for (int index = percents.Length - 1; index >= 0; index--)
            {
                if (Value(estimations, percents[index]) is not null)
                {
                    return percents[index];
                }
            }
            return null;
        }
    }
}
