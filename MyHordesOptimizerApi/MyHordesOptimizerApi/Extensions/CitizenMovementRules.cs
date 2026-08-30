using System;
using MyHordesOptimizerApi.Data.Items;

namespace MyHordesOptimizerApi.Extensions
{
    /// <summary>
    /// Formules de déplacement portées à la main depuis BeyondController::desert_move_api et
    /// CitizenHandler::deductPointsWithFallback — voir section 6 du spec
    /// (docs/superpowers/specs/2026-08-14-simulateur-pa-etats-om-design.md).
    /// </summary>
    public static class CitizenMovementRules
    {
        // Source: BeyondController::desert_move_api, $primaryPointSource (BeyondController.php:~814)
        public static PointType GetPrimarySource(bool isNearZone) => isNearZone ? PointType.Ap : PointType.Sp;

        // Source: CitizenHandler::deductPointsWithFallback (CitizenHandler.php:525-540)
        // Fallback toujours AP. Si primaire == AP, pas de vrai fallback (clamp à 0).
        public static (int Ap, int Sp) DeductWithFallback(int ap, int sp, PointType primary, int amount)
        {
            if (primary == PointType.Ap)
                return (Math.Max(0, ap - amount), sp);

            if (amount <= sp)
                return (ap, sp - amount);

            var shortfall = amount - sp;
            return (Math.Max(0, ap - shortfall), 0);
        }
    }
}
