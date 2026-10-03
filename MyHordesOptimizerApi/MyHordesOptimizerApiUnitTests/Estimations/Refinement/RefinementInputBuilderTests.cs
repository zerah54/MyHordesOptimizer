using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Services.Impl.Estimations.Refinement;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Estimations.Refinement
{
    public class RefinementInputBuilderTests
    {
        private static readonly Dictionary<int, int> NoSoul = new();
        private static EstimationValueDto Value(int min, int max) => new() { Min = min, Max = max };

        [Fact]
        public void Day16_places_the_tower_on_paliers_8_to_24_and_the_planner_on_0_to_24()
        {
            var input = RefinementInputBuilder.Build(16, new EstimationsDto { _33 = Value(3400, 4259), _100 = Value(3633, 3957) }, NoSoul, 0,
                new EstimationsDto { _0 = Value(3260, 4360) }, NoSoul, 0, false, null)!;

            input.Observed[8].Should().Be(3400);
            input.Observed[25 + 8].Should().Be(4259);
            input.Observed[24].Should().Be(3633);
            input.Observed[50].Should().Be(3260);
            input.Observed[75].Should().Be(4360);
            input.Observed.Count(value => value != RefinementModel.NoConstraint).Should().Be(6);
            input.ObservedPlanif.Should().BeNull();
            var p = input.Params;
            (p.BaseLoRand, p.BaseHiRand, p.OffSum, p.Protect, p.Blocks, p.ShiftSteps, p.MinGlobal, p.MaxGlobal).Should().Be((4, 20, 21, 3, 20, 750, 2860, 4096));
            p.ShiftSpan.Should().Be(0.75 * 10 / 100);
            p.SoulTdg.Should().OnlyContain(factor => factor == 1.0);
        }

        [Fact]
        public void Fireworks_route_the_planner_to_its_own_buffer()
        {
            var input = RefinementInputBuilder.Build(16, new EstimationsDto { _33 = Value(3000, 3500) }, NoSoul, 0,
                new EstimationsDto { _0 = Value(3260, 4360) }, NoSoul, 0, true, null)!;

            input.Observed[50].Should().Be(RefinementModel.NoConstraint);
            input.ObservedPlanif![50].Should().Be(3260);
            input.Params.Fireworks.Should().BeTrue();
            input.Params.ReboundPossible.Should().BeTrue();
        }

        [Fact]
        public void Soul_factors_follow_each_family_SPA_level()
        {
            var input = RefinementInputBuilder.Build(16, new EstimationsDto { _33 = Value(3000, 3500) }, new Dictionary<int, int> { [33] = 1 }, 0,
                null, new Dictionary<int, int> { [0] = 2 }, 2, false, null)!;

            input.Params.SoulTdg[8].Should().Be(1 + 0.04 * 1);
            input.Params.SoulPlanif[0].Should().Be(1 + 0.02 * 2);
        }

        [Fact]
        public void Without_any_estimation_returns_null() =>
            RefinementInputBuilder.Build(1, null, NoSoul, 0, null, NoSoul, 0, false, null).Should().BeNull();

        [Theory]
        [InlineData(15, 1.0)]
        [InlineData(16, 0.75)]
        [InlineData(21, 0.5)]
        [InlineData(31, 0.25)]
        [InlineData(41, 0.15)]
        public void Factor_follows_the_day(int day, double factor) => RefinementInputBuilder.FactorForDay(day).Should().Be(factor);
    }
}
