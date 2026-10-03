using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Services.Impl.Estimations.Refinement;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Estimations.Refinement
{
    public class RefinementEngineTests
    {
        private static readonly Dictionary<int, int> NoSoul = new();
        private static EstimationValueDto Value(int min, int max) => new() { Min = min, Max = max };

        /// <summary>J16 planté (seed 777001, base 10, valeur 3750) : saisies relevées sur la trajectoire du jeu.</summary>
        private static RefinementInput J16(bool withPalier67 = false, int min33 = 3400)
        {
            var tdg = new EstimationsDto { _33 = Value(min33, 4259), _50 = Value(3483, 4229) };
            if (withPalier67)
            {
                tdg._67 = Value(3556, 4202);
            }
            return RefinementInputBuilder.Build(16, tdg, NoSoul, 0, new EstimationsDto { _0 = Value(3260, 4360) }, NoSoul, 0, false, null)!;
        }

        [Fact]
        public void The_planted_seed_yields_the_true_value()
        {
            var outcome = RefinementEngine.Process(J16(), new uint[] { 777001 });
            outcome.Values.Should().Contain(3750);
            outcome.Triples.Should().Contain(new RefinementTriple(777001, 21, 10));
        }

        [Fact]
        public void Refilter_with_an_added_palier_equals_a_full_replay()
        {
            var seeds = Enumerable.Range(0, 2000).Select(i => (uint)(776001 + i)).ToArray();
            var first = RefinementEngine.Process(J16(), seeds);
            var refiltered = RefinementEngine.Refilter(J16(withPalier67: true), first.Triples);
            var replayed = RefinementEngine.Process(J16(withPalier67: true), seeds);
            refiltered.Values.Should().Equal(replayed.Values);
            refiltered.Triples.Should().BeEquivalentTo(replayed.Triples);
        }

        [Fact]
        public void Adding_a_palier_keeps_compatibility_correcting_one_breaks_it()
        {
            RefinementEngine.IsCompatible(J16(), J16(withPalier67: true)).Should().BeTrue();
            RefinementEngine.IsCompatible(J16(), J16(min33: 3401)).Should().BeFalse();
            RefinementEngine.IsCompatible(J16(withPalier67: true), J16()).Should().BeFalse();
        }

        [Fact]
        public void Changing_a_soul_factor_on_a_constrained_palier_breaks_compatibility()
        {
            var withSoul = RefinementInputBuilder.Build(16, new EstimationsDto { _33 = Value(3400, 4259), _50 = Value(3483, 4229) },
                new Dictionary<int, int> { [33] = 1 }, 0, new EstimationsDto { _0 = Value(3260, 4360) }, NoSoul, 0, false, null)!;
            RefinementEngine.IsCompatible(J16(), withSoul).Should().BeFalse();
        }

        [Fact]
        public void Triples_round_trip_through_six_bytes_each()
        {
            var triples = new List<RefinementTriple> { new(777001, 21, 10), new(uint.MaxValue, 29, 26) };
            var bytes = RefinementEngine.Encode(triples);
            bytes.Length.Should().Be(12);
            RefinementEngine.Decode(bytes).Should().Equal(triples);
        }

        [Fact]
        public void DecodeSeeds_reads_little_endian_uint32()
        {
            var base64 = Convert.ToBase64String(BitConverter.GetBytes(777001u).Concat(BitConverter.GetBytes(1u)).ToArray());
            RefinementEngine.DecodeSeeds(base64).Should().Equal(777001u, 1u);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("pas du base64 !")]
        [InlineData("AAAA")]
        public void DecodeSeeds_rejects_malformed_payloads(string? base64) => RefinementEngine.DecodeSeeds(base64).Should().BeNull();

        [Fact]
        public void DecodeSeeds_rejects_more_than_65536_seeds() =>
            RefinementEngine.DecodeSeeds(Convert.ToBase64String(new byte[(RefinementEngine.MaxCandidates + 1) * 4])).Should().BeNull();

        [Fact]
        public void Duplicate_seeds_are_replayed_once() =>
            RefinementEngine.Process(J16(), new uint[] { 777001, 777001 }).SeedCount.Should().Be(1);
    }
}
