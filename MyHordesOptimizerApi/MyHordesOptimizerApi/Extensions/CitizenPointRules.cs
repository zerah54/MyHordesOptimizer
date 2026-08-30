using System;
using MyHordesOptimizerApi.Data.Items;

namespace MyHordesOptimizerApi.Extensions
{
    /// <summary>
    /// Formules de PA/PE portées à la main depuis le code source MyHordes (logique impérative,
    /// pas un catalogue de données — pas de dérivation mécanique possible). Vérifiées contre le
    /// commit c05060df09aadead4685ff629a0bc97af9ae079e (2026-08-02). Voir section 8 du spec
    /// (docs/superpowers/specs/2026-08-14-referentiel-effets-actions-om-design.md) pour la
    /// procédure à suivre si le jeu change une de ces règles.
    /// </summary>
    public static class CitizenPointRules
    {
        // Source: CitizenHandler::getMaxAP (CitizenHandler.php:435-439)
        public static int GetMaxAp(bool wounded) => wounded ? 5 : 6;

        // Source: CitizenHandler::getMaxSP (CitizenHandler.php:502-505) +
        // CitizenChanceQueryListener::getParameterInfo, cas MaxSpExtension (:392-396)
        public static int GetMaxSp(bool isEclaireur, bool hasBike, bool hasShoes) =>
            (isEclaireur ? 2 : 0) + (hasBike ? 2 : 0) + (hasShoes ? 1 : 0);

        // Source: ProcessStatusEffect::__invoke (ProcessStatusEffect.php:132-145) +
        // CitizenHandler::setAP (:449-461)
        public static int ApplyPointEffect(
            int currentValue, int maxValue, RelativeMaxPoint relativeToMax,
            int pointValue, int? capAt, int? exceedMax)
        {
            if (relativeToMax != RelativeMaxPoint.Absolute)
            {
                var target = Math.Min(maxValue > 0 ? maxValue + pointValue : 0, capAt ?? int.MaxValue);
                return Math.Max(currentValue, target); // plancher, jamais de baisse
            }

            // `pointValue < 0 ? null : pointExceedMax` (ProcessStatusEffect.php:141)
            var bonus = pointValue < 0 ? (int?)null : exceedMax;
            var to = Math.Min(currentValue + pointValue, capAt ?? int.MaxValue);

            if (bonus is null)
                return Math.Max(0, to);

            // setAP, branche max_bonus non nulle : plafonne à (max + bonus), sauf si la valeur
            // actuelle le dépassait déjà — elle est alors préservée, jamais réduite.
            var ceiling = Math.Max(maxValue + bonus.Value, currentValue);
            return Math.Max(0, Math.Min(ceiling, to));
        }
    }
}
