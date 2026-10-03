using System.Collections.Generic;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;

namespace MyHordesOptimizerApi.Services.Impl.Estimations
{
    /// <summary>
    /// Âmes et niveau SPA à l'attaque du jour D : valeurs saisies, sinon celles du palier renseigné le plus haut
    /// de la tour du jour D, sinon du planificateur de la veille (suppose ni purification ni vote).
    /// </summary>
    public static class AttackSoulsDefaults
    {
        public static (int Souls, int SpaLevel) Resolve(EstimationRequestDto tdgDay, EstimationRequestDto planifDay, AttackSettingsDto settings)
        {
            var (defaultSouls, defaultSpaLevel, _) = Defaults(tdgDay, planifDay);
            return (settings.Souls ?? defaultSouls, settings.SpaLevel ?? defaultSpaLevel);
        }

        /// <summary>Valeurs appliquées sans réglage saisi, et leur famille d'origine (true = tour du jour D).</summary>
        public static (int Souls, int SpaLevel, bool FromTdg) Defaults(EstimationRequestDto tdgDay, EstimationRequestDto planifDay)
        {
            if (EstimationPercents.HighestFilled(tdgDay.Estim, EstimationPercents.Tdg) is int tdgPercent)
            {
                return (tdgDay.EstimSouls?.GetValueOrDefault(tdgPercent) ?? 0, tdgDay.EstimSpaLevel ?? 0, true);
            }
            int? planifPercent = EstimationPercents.HighestFilled(planifDay.Planif, EstimationPercents.Planif);
            int souls = planifPercent is int percent ? planifDay.PlanifSouls?.GetValueOrDefault(percent) ?? 0 : 0;
            return (souls, planifDay.PlanifSpaLevel ?? 0, false);
        }
    }
}
