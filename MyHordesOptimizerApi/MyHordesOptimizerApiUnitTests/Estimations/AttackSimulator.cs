using System;
using System.Collections.Generic;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;

namespace MyHordesOptimizerApiUnitTests.Estimations
{
    /// <summary>
    /// Port des actions du jeu (PrepareZombieAttackEstimationAction + EstimateZombieAttackAction,
    /// difficulté normale, sans feux d'artifice) : produit les lignes que la tour et le planif afficheraient,
    /// avec des âmes propres à chaque ligne, et l'attaque réelle de la nuit. Sert de banc de sûreté :
    /// le solveur ne doit jamais exclure <see cref="Simulated.RealAttack"/>.
    /// </summary>
    internal static class AttackSimulator
    {
        private static readonly int[] BucketPercents = { 0, 4, 8, 13, 17, 21, 25, 29, 33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100 };

        internal sealed record Simulated(
            EstimationsDto Tdg, EstimationsDto Planif,
            Dictionary<int, int> TdgSouls, Dictionary<int, int> PlanifSouls,
            int RealAttack);

        /// <summary>Facteur d'âmes recalculé ici, indépendamment du code de production.</summary>
        internal static double SoulFactor(int souls, int townTypeId) =>
            Math.Min(1.0 + 0.04 * souls, townTypeId == (int)TownType.PANDE ? 666.0 : 1.2);

        private static double PhpRound(double x) => Math.Round(x, MidpointRounding.AwayFromZero);

        private static bool Chance(Random rng, double c) => c >= 1.0 || (c > 0.0 && rng.Next(0, 100) < 100 * c);

        private static bool Deshift(double value, int boundMin, int boundMax, ref double offMin, ref double offMax)
        {
            double lowRoom = (value - boundMin) / value;
            double highRoom = (boundMax - value) / value;
            if (offMin > lowRoom)
            {
                offMax += offMin - lowRoom;
                offMin = lowRoom;
                return true;
            }
            if (offMax > highRoom)
            {
                offMin += offMax - highRoom;
                offMax = highRoom;
                return true;
            }
            return false;
        }

        private static void SetRow(EstimationsDto dto, int percent, int min, int max) =>
            typeof(EstimationsDto).GetProperty("_" + percent)!.SetValue(dto, new EstimationValueDto { Min = min, Max = max });

        internal static Simulated Simulate(int seed, int day, int townTypeId,
            Func<int, int> tdgSoulsAt, Func<int, int> planifSoulsAt, int attackSouls)
        {
            if (day <= 3) throw new ArgumentOutOfRangeException(nameof(day), "jours ≤ 3 : ratios différents, non simulés");
            var rng = new Random(seed);
            double factor = day <= 15 ? 1.0 : day <= 20 ? 0.75 : day <= 30 ? 0.5 : day <= 40 ? 0.25 : 0.15;
            int boundMin = (int)PhpRound(1.1 * Math.Pow(Math.Max(1, day - 1) * 0.75 + 2.5, 3));
            int boundMax = (int)PhpRound(1.1 * Math.Pow(day * 0.75 + 3.5, 3));

            // Prepare : valeur, offsets, shifts, cibles.
            int value = rng.Next(boundMin, boundMax + 1);
            if (value > boundMin + 0.5 * (boundMax - boundMin)) value = rng.Next(boundMin, boundMax + 1);
            int offMin = rng.Next((int)PhpRound(factor * 5), (int)PhpRound(factor * 26) + 1);
            double offMax = PhpRound(factor * 28) - offMin;
            double shiftMin = rng.Next(0, (int)(10 * factor * 100) + 1) / 10000.0;
            double shiftMax = factor * 10 / 100.0 - shiftMin;
            Deshift(value, boundMin, boundMax, ref shiftMin, ref shiftMax);
            int targetMin = (int)PhpRound(value - value * shiftMin);
            int targetMax = (int)PhpRound(value + value * shiftMax);
            double o1 = offMin / 100.0, o2 = offMax / 100.0;
            bool reboundMin = Deshift(targetMin, boundMin, boundMax, ref o1, ref o2);
            bool reboundMax = Deshift(targetMax, boundMin, boundMax, ref o1, ref o2);
            double storedOffMin = offMin, storedOffMax = offMax;
            if (reboundMin || reboundMax)
            {
                storedOffMin = PhpRound(o1 * 100);
                storedOffMax = PhpRound(o2 * 100);
                int protect = day <= 30 ? 3 : 1;
                if (storedOffMin < protect)
                {
                    storedOffMax -= protect - storedOffMin;
                    storedOffMin = protect;
                }
                else if (storedOffMax < protect)
                {
                    storedOffMin -= protect - storedOffMax;
                    storedOffMax = protect;
                }
            }

            // Estimate : trajectoire d'offsets après q citoyens (calculate_offsets).
            var traj = new (double Min, double Max)[25];
            double oMin = Math.Floor(storedOffMin), oMax = Math.Floor(storedOffMax);
            traj[0] = (oMin, oMax);
            for (int i = 0; i < 24; i++)
            {
                double spendable = (Math.Max(0, oMin) + Math.Max(0, oMax)) / (24 - i);
                if (oMin + oMax > 0)
                {
                    bool incMin = Chance(rng, oMin / (oMin + oMax));
                    int lo = (int)Math.Floor(spendable * 250), hi = (int)Math.Floor(spendable * 1000);
                    double alter = rng.Next(lo, hi + 1) / 1000.0;
                    if (Chance(rng, 0.25))
                    {
                        double alterMax = rng.Next(lo, hi + 1) / 1000.0;
                        oMin = Math.Max(0, oMin - alter);
                        oMax = Math.Max(0, oMax - alterMax);
                    }
                    else if (incMin && oMin > 0) oMin = Math.Max(0, oMin - alter);
                    else oMax = Math.Max(0, oMax - alter);
                }
                traj[i + 1] = (oMin, oMax);
            }

            (int Min, int Max) Displayed(int q, double pf) => (
                (int)PhpRound((targetMin - targetMin * traj[q].Min / 100) * pf),
                (int)PhpRound((targetMax + targetMax * traj[q].Max / 100) * pf));

            var tdg = new EstimationsDto();
            var planif = new EstimationsDto();
            var tdgSouls = new Dictionary<int, int>();
            var planifSouls = new Dictionary<int, int>();
            int blocks = (int)(Math.Ceiling(day / 5.0) * 5);
            for (int q = 0; q <= 24; q++)
            {
                bool tdgRow = q >= 8 && rng.NextDouble() < 0.7;
                bool planifRow = rng.NextDouble() < 0.5;
                if (q == 24 && tdgSouls.Count == 0) tdgRow = true;
                int percent = BucketPercents[q];
                if (tdgRow)
                {
                    int souls = tdgSoulsAt(q);
                    var (min, max) = Displayed(q, SoulFactor(souls, townTypeId));
                    SetRow(tdg, percent, min, max);
                    tdgSouls[percent] = souls;
                }
                if (planifRow)
                {
                    int souls = planifSoulsAt(q);
                    var (min, max) = Displayed(q, SoulFactor(souls, townTypeId));
                    SetRow(planif, percent, (int)(Math.Floor(min / (double)blocks) * blocks), (int)(Math.Ceiling(max / (double)blocks) * blocks));
                    planifSouls[percent] = souls;
                }
            }

            int realAttack = (int)PhpRound(value * SoulFactor(attackSouls, townTypeId));
            return new Simulated(tdg, planif, tdgSouls, planifSouls, realAttack);
        }
    }
}
