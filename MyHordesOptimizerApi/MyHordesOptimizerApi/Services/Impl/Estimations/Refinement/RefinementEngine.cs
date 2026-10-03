using System;
using System.Buffers.Binary;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Estimations.Refinement
{
    /// <summary>Couple (seed, configuration d'offsets initiale) compatible avec les saisies.</summary>
    public readonly record struct RefinementTriple(uint Seed, int Sum, int Base);

    /// <summary>Résultat d'un rejeu : couples retenus, valeurs d'attaque compatibles et % de réduction feux d'artifice.</summary>
    public sealed class RefinementOutcome
    {
        public List<RefinementTriple> Triples { get; } = new();
        public SortedSet<int> Values { get; } = new();
        public SortedSet<int> Reductions { get; } = new();
        public int SeedCount => Triples.Select(triple => triple.Seed).Distinct().Count();
    }

    /// <summary>Rejeu exact des seeds candidats (port de deriveValueRange du site, couple par couple).</summary>
    public static class RefinementEngine
    {
        public const int MaxCandidates = 65536;
        private const int TripleSize = 6;

        /// <summary>Ne rejoue que les couples stockés dont la configuration existe encore (le gate rebound ne fait que se resserrer).</summary>
        public static RefinementOutcome Refilter(RefinementInput input, IEnumerable<RefinementTriple> triples)
        {
            var allowed = AllPairs(input.Params).ToHashSet();
            return Evaluate(input, triples
                .Where(triple => allowed.Contains((triple.Sum, triple.Base)))
                .GroupBy(triple => triple.Seed)
                .Select(group => (group.Key, group.Select(triple => (triple.Sum, triple.Base)))));
        }

        /// <summary>
        /// Les candidats complets pour <paramref name="frozen"/> le restent pour <paramref name="current"/> si
        /// chaque palier figé garde sa valeur et son facteur d'âmes, avec les mêmes paramètres du jour et feux d'artifice.
        /// </summary>
        public static bool IsCompatible(RefinementInput frozen, RefinementInput current)
        {
            var f = frozen.Params;
            var c = current.Params;
            if (f.Fireworks != c.Fireworks || f.BaseLoRand != c.BaseLoRand || f.BaseHiRand != c.BaseHiRand || f.OffSum != c.OffSum
                || f.Protect != c.Protect || f.Blocks != c.Blocks || f.ShiftSpan != c.ShiftSpan || f.ShiftSteps != c.ShiftSteps
                || f.MinGlobal != c.MinGlobal || f.MaxGlobal != c.MaxGlobal)
            {
                return false;
            }
            if (!f.ReboundPossible && c.ReboundPossible)
            {
                return false;
            }
            if (!SlotsKept(frozen.Observed, current.Observed, f, c))
            {
                return false;
            }
            return frozen.ObservedPlanif is null || (current.ObservedPlanif is not null && SlotsKept(frozen.ObservedPlanif, current.ObservedPlanif, f, c));
        }

        public static byte[] Encode(IReadOnlyCollection<RefinementTriple> triples)
        {
            var bytes = new byte[triples.Count * TripleSize];
            int offset = 0;
            foreach (var triple in triples)
            {
                BinaryPrimitives.WriteUInt32LittleEndian(bytes.AsSpan(offset), triple.Seed);
                bytes[offset + 4] = (byte)triple.Sum;
                bytes[offset + 5] = (byte)triple.Base;
                offset += TripleSize;
            }
            return bytes;
        }

        public static List<RefinementTriple> Decode(byte[] bytes)
        {
            var triples = new List<RefinementTriple>(bytes.Length / TripleSize);
            for (int offset = 0; offset + TripleSize <= bytes.Length; offset += TripleSize)
            {
                triples.Add(new RefinementTriple(BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(offset)), bytes[offset + 4], bytes[offset + 5]));
            }
            return triples;
        }

        /// <summary>Seeds envoyés par le client (base64 d'uint32 petit-boutistes). Null si malformé ou au-delà du plafond.</summary>
        public static uint[]? DecodeSeeds(string? base64)
        {
            if (base64 is null)
            {
                return null;
            }
            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(base64);
            }
            catch (FormatException)
            {
                return null;
            }
            if (bytes.Length % 4 != 0 || bytes.Length / 4 > MaxCandidates)
            {
                return null;
            }
            var seeds = new uint[bytes.Length / 4];
            for (int index = 0; index < seeds.Length; index++)
            {
                seeds[index] = BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(index * 4));
            }
            return seeds;
        }

        private static bool SlotsKept(int[] frozen, int[] current, RefinementParams frozenParams, RefinementParams currentParams)
        {
            for (int slot = 0; slot < 100; slot++)
            {
                if (frozen[slot] == RefinementModel.NoConstraint)
                {
                    continue;
                }
                if (current[slot] != frozen[slot] || SlotFactor(currentParams, slot) != SlotFactor(frozenParams, slot))
                {
                    return false;
                }
            }
            return true;
        }

        private static double SlotFactor(RefinementParams p, int slot) => slot < 50 ? p.SoulTdg[slot % 25] : p.SoulPlanif[slot % 25];

        /// <summary>Rejoue chaque seed (dédoublonné) sur toutes les configurations d'offsets des entrées.</summary>
        public static RefinementOutcome Process(RefinementInput input, IEnumerable<uint> seeds)
        {
            var pairs = AllPairs(input.Params).ToList();
            return Evaluate(input, seeds.Distinct().Select(seed => (seed, (IEnumerable<(int Sum, int Base)>)pairs)));
        }

        private static IEnumerable<(int Sum, int Base)> AllPairs(RefinementParams p) =>
            RefinementModel.OffsetConfigs(p).SelectMany(config =>
                Enumerable.Range(config.BaseLo, Math.Max(0, config.BaseHi - config.BaseLo + 1)).Select(baseOffset => (config.Sum, baseOffset)));

        private static RefinementOutcome Evaluate(RefinementInput input, IEnumerable<(uint Seed, IEnumerable<(int Sum, int Base)> Pairs)> work)
        {
            var outcome = new RefinementOutcome();
            var mt = new PhpMt();
            foreach (var (seed, pairs) in work)
            {
                mt.Seed(seed);
                foreach (var (sum, baseOffset) in pairs)
                {
                    mt.Rewind();
                    if (!RefinementModel.TryTargetWindows(mt, input.Observed, input.ObservedPlanif, input.Params, baseOffset, sum - baseOffset, out var window, out var windowPre))
                    {
                        continue;
                    }
                    if (RefinementModel.AddCompatibleValues(outcome.Values, window, input.Params, input.ObservedPlanif is null ? null : windowPre, outcome.Reductions))
                    {
                        outcome.Triples.Add(new RefinementTriple(seed, sum, baseOffset));
                    }
                }
            }
            return outcome;
        }
    }
}
