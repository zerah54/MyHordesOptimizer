using System;
using System.Collections.Generic;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;

namespace MyHordesOptimizerApi.Services.Impl.Estimations.Refinement
{
    /// <summary>
    /// Entrées du scan de l'attaque du jour D, construites depuis la base : tour du jour D (paliers 8..24) et
    /// planificateur saisi en D−1 (paliers 0..24, arrondi au bloc ceil(D/5)·5). Seule implémentation des
    /// paramètres du jour : le site les reçoit d'ici.
    /// </summary>
    public static class RefinementInputBuilder
    {
        /// <summary>Facteur d'atténuation des offsets selon le jour attaqué.</summary>
        public static double FactorForDay(int day) => day <= 15 ? 1.0 : day <= 20 ? 0.75 : day <= 30 ? 0.5 : day <= 40 ? 0.25 : 0.15;

        /// <summary>Null si aucune des deux familles n'a de palier saisi.</summary>
        public static RefinementInput? Build(int attackDay, EstimationsDto? tdg, IReadOnlyDictionary<int, int> tdgSouls, int tdgSpaLevel,
            EstimationsDto? planif, IReadOnlyDictionary<int, int> planifSouls, int planifSpaLevel, bool fireworks, int? townTypeId)
        {
            var observed = Unconstrained();
            var observedPlanif = Unconstrained();
            bool hasTdg = Fill(observed, tdg, EstimationPercents.Tdg, 8);
            bool hasPlanif = Fill(fireworks ? observedPlanif : observed, planif, EstimationPercents.Planif, 0, slotOffset: 50);
            if (!hasTdg && !hasPlanif)
            {
                return null;
            }

            var soulTdg = Ones();
            var soulPlanif = Ones();
            for (int index = 0; index < EstimationPercents.Tdg.Length; index++)
            {
                soulTdg[8 + index] = RedSoulFactor.Compute(tdgSouls.GetValueOrDefault(EstimationPercents.Tdg[index]), townTypeId, tdgSpaLevel);
            }
            for (int index = 0; index < EstimationPercents.Planif.Length; index++)
            {
                soulPlanif[index] = RedSoulFactor.Compute(planifSouls.GetValueOrDefault(EstimationPercents.Planif[index]), townTypeId, planifSpaLevel);
            }

            double factor = FactorForDay(attackDay);
            double ratioMin = attackDay <= 3 ? 0.75 : 1.1;
            double ratioMax = attackDay <= 1 ? 0.5 : (attackDay <= 3 ? 0.75 : 1.1);
            var parameters = new RefinementParams
            {
                BaseLoRand = RoundHalfUp(factor * 5),
                BaseHiRand = RoundHalfUp(factor * 26),
                OffSum = RoundHalfUp(factor * 28),
                Protect = attackDay <= 30 ? 3 : 1,
                Blocks = (int)(Math.Ceiling(attackDay / 5.0) * 5),
                SoulTdg = soulTdg,
                SoulPlanif = soulPlanif,
                ShiftSpan = factor * 10 / 100,
                ShiftSteps = RoundHalfUp(10 * factor * 100),
                MinGlobal = (int)Math.Round(ratioMin * Math.Pow(Math.Max(1, attackDay - 1) * 0.75 + 2.5, 3), MidpointRounding.AwayFromZero),
                MaxGlobal = (int)Math.Round(ratioMax * Math.Pow(attackDay * 0.75 + 3.5, 3), MidpointRounding.AwayFromZero),
                ReboundPossible = true,
                Fireworks = fireworks
            };
            parameters = parameters with { ReboundPossible = RefinementModel.IsReboundPossible(observed, parameters) };
            return new RefinementInput { Observed = observed, ObservedPlanif = fireworks && hasPlanif ? observedPlanif : null, Params = parameters };
        }

        /// <summary>Math.round du site (positifs).</summary>
        private static int RoundHalfUp(double value) => (int)Math.Floor(value + 0.5);

        private static int[] Unconstrained()
        {
            var observed = new int[100];
            Array.Fill(observed, RefinementModel.NoConstraint);
            return observed;
        }

        private static double[] Ones()
        {
            var factors = new double[25];
            Array.Fill(factors, 1.0);
            return factors;
        }

        private static bool Fill(int[] observed, EstimationsDto? estimations, int[] percents, int qOffset, int slotOffset = 0)
        {
            bool filled = false;
            for (int index = 0; index < percents.Length; index++)
            {
                int q = qOffset + index;
                if (q > 24)
                {
                    break;
                }
                if (EstimationPercents.Value(estimations, percents[index]) is not { } value)
                {
                    continue;
                }
                if (value.Min > 0)
                {
                    observed[slotOffset + q] = value.Min;
                    filled = true;
                }
                if (value.Max > 0)
                {
                    observed[slotOffset + 25 + q] = value.Max;
                    filled = true;
                }
            }
            return filled;
        }
    }
}
