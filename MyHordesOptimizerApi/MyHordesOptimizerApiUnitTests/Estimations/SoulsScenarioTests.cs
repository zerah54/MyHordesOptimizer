using System.Collections.Generic;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Services.Impl.Estimations;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Estimations
{
    public class SoulsScenarioTests
    {
        [Theory]
        [InlineData(0, (int)TownType.RE, 1.0)]
        [InlineData(1, (int)TownType.RE, 1.04)]
        [InlineData(5, (int)TownType.RNE, 1.2)]
        [InlineData(6, (int)TownType.RE, 1.2)]
        [InlineData(6, (int)TownType.CUSTOM, 1.2)]
        [InlineData(6, (int)TownType.PANDE, 1.24)]
        public void RedSoulFactor_applies_the_penalty_up_to_the_town_type_cap(int souls, int townType, double expected)
        {
            RedSoulFactor.Compute(souls, townType).Should().BeApproximately(expected, 1e-9);
        }

        [Fact]
        public void RedSoulFactor_uses_the_default_cap_for_an_unknown_town()
        {
            RedSoulFactor.Compute(10, null).Should().BeApproximately(1.2, 1e-9);
        }

        [Theory]
        [InlineData(1, 0, (int)TownType.RE, 1.04)]
        [InlineData(1, 1, (int)TownType.RE, 1.04)]
        [InlineData(1, 2, (int)TownType.RE, 1.02)]
        [InlineData(1, 3, (int)TownType.RE, 1.02)]
        [InlineData(50, 2, (int)TownType.RNE, 1.2)]
        [InlineData(50, 2, (int)TownType.PANDE, 2.0)]
        public void RedSoulFactor_uses_the_reduced_penalty_from_spa_level_two(int souls, int spaLevel, int townType, double expected)
        {
            RedSoulFactor.Compute(souls, townType, spaLevel).Should().BeApproximately(expected, 1e-9);
        }

        [Fact]
        public void A_scenario_with_only_zeros_is_neutral()
        {
            new SoulsScenario(0, new Dictionary<int, int> { [33] = 0 }, new Dictionary<int, int>()).IsNeutral.Should().BeTrue();
        }
    }
}
