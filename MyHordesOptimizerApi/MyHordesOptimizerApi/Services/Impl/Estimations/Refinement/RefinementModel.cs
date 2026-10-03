using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Impl.Estimations.Refinement
{
    /// <summary>Fenêtres entières [targetMin, targetMax] compatibles avec les paliers.</summary>
    public readonly record struct TargetWindow(int TMinLo, int TMinHi, int TMaxLo, int TMaxHi);

    /// <summary>Configuration d'offsets initiaux explorée : somme et plage de bases.</summary>
    public readonly record struct OffsetConfig(int Sum, int BaseLo, int BaseHi);

    /// <summary>
    /// Port fidèle de attack-model.ts (site) : rejeu f64 exact de PrepareZombieAttackEstimationAction /
    /// EstimateZombieAttackAction et dérivation des valeurs d'attaque compatibles. Ordre des opérations
    /// flottantes identique au TS : toute divergence est un faux négatif potentiel (RefinementParityTests).
    /// </summary>
    public static class RefinementModel
    {
        public const int NoConstraint = 2147483647;
        private const int Shift = 10;
        private const int Spread = 10;
        private const double RoundEps = 0.000001;
        private const int FireworksRatioMin = 13;
        private const int FireworksRatioMax = 16;

        /// <summary>round() PHP pour x > 0.</summary>
        public static int PhpRound(double value) => (int)Math.Floor(value + 0.5);

        /// <summary>Attaque réelle de la nuit : round(valeur · facteur d'âmes à l'attaque).</summary>
        public static int AttackFromValue(int value, double soulAttack) => PhpRound(value * soulAttack);

        /// <summary>Gate « rebound » (isReboundPossible du site) : false si aucun deshift n'a pu avoir lieu.</summary>
        public static bool IsReboundPossible(int[] observed, RefinementParams p)
        {
            if (p.Fireworks)
            {
                return true;
            }
            double tLo = -1;
            double tHi = -1;
            for (int q = 0; q <= 24; q++)
            {
                foreach (int slot in new[] { q, 50 + q })
                {
                    int obMin = observed[slot];
                    if (obMin != NoConstraint)
                    {
                        double pf = slot >= 50 ? p.SoulPlanif[q] : p.SoulTdg[q];
                        tLo = Math.Max(tLo, (obMin - 0.5) / pf);
                    }
                }
                foreach (int slot in new[] { 25 + q, 75 + q })
                {
                    int obMax = observed[slot];
                    if (obMax != NoConstraint)
                    {
                        double pf = slot >= 75 ? p.SoulPlanif[q] : p.SoulTdg[q];
                        double bound = (obMax + 0.5) / pf;
                        tHi = tHi < 0 ? bound : Math.Min(tHi, bound);
                    }
                }
            }
            bool minImpossible = tLo > 0 && tLo * (1 - p.BaseHiRand / 100.0) > p.MinGlobal + 1;
            bool maxImpossible = tHi > 0 && tHi * (1 + (p.OffSum - p.BaseLoRand) / 100.0) < p.MaxGlobal - 1;
            return !(minImpossible && maxImpossible);
        }

        /// <summary>Configurations (somme, plage de bases) selon la possibilité de rebound (offsetConfigs du site).</summary>
        public static List<OffsetConfig> OffsetConfigs(RefinementParams p)
        {
            if (!p.ReboundPossible)
            {
                return new List<OffsetConfig> { new(p.OffSum, p.BaseLoRand, p.BaseHiRand) };
            }
            var configs = new List<OffsetConfig>();
            for (int sum = p.OffSum - 1; sum <= p.OffSum + 1; sum++)
            {
                bool reboundOnly = sum != p.OffSum;
                configs.Add(new OffsetConfig(sum,
                    reboundOnly ? p.Protect : Math.Min(p.BaseLoRand, p.Protect),
                    reboundOnly ? sum - p.Protect : Math.Max(p.BaseHiRand, sum - p.Protect)));
            }
            return configs;
        }

        /// <summary>
        /// Rejoue sur <paramref name="mt"/> (rembobiné par l'appelant) la trajectoire (offMinBase, offMaxBase) et
        /// propage les fenêtres cibles de <paramref name="observed"/> et, si fourni, de <paramref name="observedPlanif"/>.
        /// False dès qu'une fenêtre est vide (computeTargetWindow == null côté site). Arrêt au dernier palier
        /// contraint : au-delà, les fenêtres ne bougent plus.
        /// </summary>
        public static bool TryTargetWindows(PhpMt mt, int[] observed, int[]? observedPlanif, RefinementParams p,
            int offMinBase, int offMaxBase, out TargetWindow window, out TargetWindow windowPre)
        {
            var bounds = new double[] { 1, 1e9, 1, 1e9 };
            var boundsPre = new double[] { 1, 1e9, 1, 1e9 };
            double oMin = offMinBase;
            double oMax = offMaxBase;
            int lastRound = Math.Max(LastConstrainedRound(observed), observedPlanif is null ? -1 : LastConstrainedRound(observedPlanif));
            window = default;
            windowPre = default;
            for (int q = 0; q <= 24; q++)
            {
                if (!ApplyBucketConstraints(observed, q, oMin, oMax, p, bounds))
                {
                    return false;
                }
                if (observedPlanif is not null && !ApplyBucketConstraints(observedPlanif, q, oMin, oMax, p, boundsPre))
                {
                    return false;
                }
                if (q >= lastRound)
                {
                    break;
                }
                Advance(mt, q, ref oMin, ref oMax);
            }
            window = ToWindow(bounds);
            windowPre = ToWindow(boundsPre);
            return true;
        }

        /// <summary>
        /// Ajoute les valeurs v dont (targetMin, targetMax) peut tomber dans la fenêtre (addCompatibleValues du site).
        /// Retourne true si CETTE fenêtre en accepte au moins une, même déjà présente dans <paramref name="values"/>.
        /// </summary>
        public static bool AddCompatibleValues(ISet<int> values, TargetWindow w, RefinementParams p, TargetWindow? windowPre, ISet<int> reductions)
        {
            if (p.Fireworks)
            {
                return AddCompatibleValuesFireworks(values, w, p, windowPre, reductions);
            }
            bool any = false;
            double span = p.ShiftSpan;
            for (int k = 0; k <= p.ShiftSteps; k++)
            {
                double sMin = k / 10000.0;
                double sMax = span - sMin;
                double vLo = Math.Max(Math.Max((w.TMinLo - 1) / (1 - sMin), (w.TMaxLo - 1) / (1 + sMax)), p.MinGlobal);
                double vHi = Math.Min(Math.Min((w.TMinHi + 1) / (1 - sMin), (w.TMaxHi + 1) / (1 + sMax)), p.MaxGlobal);
                for (int v = (int)Math.Ceiling(vLo); v <= (int)Math.Floor(vHi); v++)
                {
                    TryAccept(values, v, k, w, p, ref any);
                }
            }
            if (span <= 0)
            {
                return any;
            }
            // Deshift bas : shift_min plaqué sur (v−minGlobal)/v, plus petit k qui clampe strictement.
            if (w.TMinLo <= p.MinGlobal && p.MinGlobal <= w.TMinHi)
            {
                double vLo = Math.Max((w.TMaxLo - p.MinGlobal - 1) / span, p.MinGlobal);
                double vHi = Math.Min((w.TMaxHi - p.MinGlobal + 1) / span, p.MaxGlobal);
                for (int v = (int)Math.Ceiling(vLo); v <= (int)Math.Floor(vHi); v++)
                {
                    double boundMin = (double)(v - p.MinGlobal) / v;
                    int k = Math.Max(0, (int)Math.Floor(boundMin * 10000)) + 1;
                    while (k <= p.ShiftSteps && k / 10000.0 <= boundMin)
                    {
                        k++;
                    }
                    if (k <= p.ShiftSteps)
                    {
                        TryAccept(values, v, k, w, p, ref any);
                    }
                }
            }
            // Deshift haut : k = 0 donne le plus grand shift_max.
            if (w.TMaxLo <= p.MaxGlobal && p.MaxGlobal <= w.TMaxHi)
            {
                double vLo = Math.Max((p.MaxGlobal - w.TMinHi - 1) / span, p.MinGlobal);
                double vHi = Math.Min((p.MaxGlobal - w.TMinLo + 1) / span, p.MaxGlobal);
                for (int v = (int)Math.Ceiling(vLo); v <= (int)Math.Floor(vHi); v++)
                {
                    TryAccept(values, v, 0, w, p, ref any);
                }
            }
            return any;
        }

        private static void TryAccept(ISet<int> values, int v, int k, TargetWindow w, RefinementParams p, ref bool any)
        {
            bool known = values.Contains(v);
            if (known && any)
            {
                return;
            }
            if (ForwardAccepts(v, k, w, p))
            {
                values.Add(v);
                any = true;
            }
        }

        /// <summary>Feux d'artifice : énumération exhaustive (v_pré, r, k), valeur ajoutée = attaque réelle floor(v_pré·(1−r/100)).</summary>
        private static bool AddCompatibleValuesFireworks(ISet<int> values, TargetWindow w, RefinementParams p, TargetWindow? windowPre, ISet<int> reductions)
        {
            bool any = false;
            for (int r = FireworksRatioMin; r <= FireworksRatioMax; r++)
            {
                double ratio = 1 - r / 100.0;
                for (int v = p.MinGlobal; v <= p.MaxGlobal; v++)
                {
                    int realAttack = (int)Math.Floor(v * ratio);
                    double diff = v - v * ratio;
                    for (int k = 0; k <= p.ShiftSteps; k++)
                    {
                        if (ForwardAccepts(v, k, w, p, diff, windowPre))
                        {
                            values.Add(realAttack);
                            reductions.Add(r);
                            any = true;
                            break;
                        }
                    }
                }
            }
            return any;
        }

        /// <summary>Vérification forward-exacte d'un candidat (v, k) : deshift puis round, appartenance aux fenêtres (forwardAccepts du site).</summary>
        private static bool ForwardAccepts(int v, int k, TargetWindow w, RefinementParams p, double fireworksDiff = 0, TargetWindow? windowPre = null)
        {
            double sMin = k / 10000.0;
            double sMax = p.ShiftSpan - sMin;
            double boundMin = (double)(v - p.MinGlobal) / v;
            double boundMax = (double)(p.MaxGlobal - v) / v;
            if (sMin > boundMin)
            {
                sMax += sMin - boundMin;
                sMin = boundMin;
            }
            else if (sMax > boundMax)
            {
                sMin += sMax - boundMax;
                sMax = boundMax;
            }
            int tMinPre = PhpRound(v - v * sMin);
            int tMaxPre = PhpRound(v + v * sMax);
            if (windowPre is { } pre && !(tMinPre >= pre.TMinLo && tMinPre <= pre.TMinHi && tMaxPre >= pre.TMaxLo && tMaxPre <= pre.TMaxHi))
            {
                return false;
            }
            double tMin = tMinPre;
            double tMax = tMaxPre;
            if (fireworksDiff > 0)
            {
                tMin = Math.Floor(tMin - fireworksDiff);
                tMax = Math.Floor(tMax - fireworksDiff);
            }
            return tMin >= w.TMinLo && tMin <= w.TMinHi && tMax >= w.TMaxLo && tMax <= w.TMaxHi;
        }

        /// <summary>Un round de calculate_offsets (offsetTrajectory du site).</summary>
        private static void Advance(PhpMt mt, int round, ref double oMin, ref double oMax)
        {
            double spendable = (Math.Max(0, oMin) + Math.Max(0, oMax)) / (24 - round);
            if (oMin + oMax > Spread - Shift)
            {
                bool incMin = Chance(mt, oMin / (oMin + oMax));
                double alter = mt.Rand((int)Math.Floor(spendable * 250), (int)Math.Floor(spendable * 1000)) / 1000.0;
                if (Chance(mt, 0.25))
                {
                    double alterMax = mt.Rand((int)Math.Floor(spendable * 250), (int)Math.Floor(spendable * 1000)) / 1000.0;
                    oMin = Math.Max(0, oMin - alter);
                    oMax = Math.Max(0, oMax - alterMax);
                }
                else if (incMin && oMin > 0)
                {
                    oMin = Math.Max(0, oMin - alter);
                }
                else
                {
                    oMax = Math.Max(0, oMax - alter);
                }
            }
        }

        /// <summary>RandomGenerator::chance : court-circuit SANS tirage pour c ≥ 1 ou c ≤ 0.</summary>
        private static bool Chance(PhpMt mt, double c)
        {
            if (c >= 1.0)
            {
                return true;
            }
            if (c <= 0.0)
            {
                return false;
            }
            return mt.Rand(0, 99) < 100 * c;
        }

        private static bool ApplyBucketConstraints(int[] observed, int q, double offMin, double offMax, RefinementParams p, double[] w)
        {
            double pfTdg = p.SoulTdg[q];
            double pfPlanif = p.SoulPlanif[q];
            int blocks = p.Blocks;
            int obMinTdg = observed[q];
            int obMaxTdg = observed[25 + q];
            int obMinPlanif = observed[50 + q];
            int obMaxPlanif = observed[75 + q];
            if (obMinTdg != NoConstraint)
            {
                double fMin = (1 - offMin / 100) * pfTdg;
                w[0] = Math.Max(w[0], (obMinTdg - 0.5 - RoundEps) / fMin);
                w[1] = Math.Min(w[1], (obMinTdg + 0.5 + RoundEps) / fMin);
            }
            if (obMinPlanif != NoConstraint)
            {
                double fMin = (1 - offMin / 100) * pfPlanif;
                w[0] = Math.Max(w[0], (obMinPlanif - 0.5 - RoundEps) / fMin);
                w[1] = Math.Min(w[1], (obMinPlanif + blocks - 0.5 + RoundEps) / fMin);
            }
            if (obMaxTdg != NoConstraint)
            {
                double fMax = (1 + offMax / 100) * pfTdg;
                w[2] = Math.Max(w[2], (obMaxTdg - 0.5 - RoundEps) / fMax);
                w[3] = Math.Min(w[3], (obMaxTdg + 0.5 + RoundEps) / fMax);
            }
            if (obMaxPlanif != NoConstraint)
            {
                double fMax = (1 + offMax / 100) * pfPlanif;
                w[2] = Math.Max(w[2], (obMaxPlanif - blocks + 0.5 - RoundEps) / fMax);
                w[3] = Math.Min(w[3], (obMaxPlanif + 0.5 + RoundEps) / fMax);
            }
            return Math.Ceiling(w[0]) <= Math.Floor(w[1]) && Math.Ceiling(w[2]) <= Math.Floor(w[3]);
        }

        private static int LastConstrainedRound(int[] observed)
        {
            for (int q = 24; q >= 0; q--)
            {
                if (observed[q] != NoConstraint || observed[25 + q] != NoConstraint || observed[50 + q] != NoConstraint || observed[75 + q] != NoConstraint)
                {
                    return q;
                }
            }
            return -1;
        }

        private static TargetWindow ToWindow(double[] bounds) =>
            new((int)Math.Ceiling(bounds[0]), (int)Math.Floor(bounds[1]), (int)Math.Ceiling(bounds[2]), (int)Math.Floor(bounds[3]));
    }
}
