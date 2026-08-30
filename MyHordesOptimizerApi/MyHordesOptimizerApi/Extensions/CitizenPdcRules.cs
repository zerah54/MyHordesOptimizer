using MyHordesOptimizerApi.Models.CitizenState;

namespace MyHordesOptimizerApi.Extensions
{
    /// <summary>
    /// Formule portée à la main depuis CitizenHandler::getCP (CitizenHandler.php:542-577). Voir
    /// docs/superpowers/specs/2026-08-20-pdc-state-manager-design.md section 2 pour la procédure de
    /// mise à jour si le jeu change cette règle. Les 4 bonus "perk" (clean/hydraté/sobre/base) ne
    /// sont pas dérivés d'un lookup de compétences héroïques réelles — cases à cocher manuelles,
    /// voir section 2 du spec.
    /// </summary>
    public static class CitizenPdcRules
    {
        public static int ComputeCurrentPdc(CitizenState state)
        {
            if (state.Statuses.Contains("terror")) return 0;

            var pdc = 2;
            if (state.HasShield) pdc += 2;
            if (state.HasDefenceCpItem) pdc += 1;
            if (state.IsGuide) pdc += state.ZoneCitizenCount;
            if (state.HasBaseZoneControlPerk) pdc += 1;
            if (state.HasCleanPdcPerk && !state.Statuses.Contains("drugged") && !state.Statuses.Contains("addict"))
                pdc += 1;
            if (state.HasHydratedPdcPerk && !state.Statuses.Contains("thirst1") && !state.Statuses.Contains("thirst2"))
                pdc += 1;
            if (state.HasSoberPdcPerk && !state.Statuses.Contains("drunk") && !state.Statuses.Contains("hungover"))
                pdc += 1;
            return pdc;
        }
    }
}
