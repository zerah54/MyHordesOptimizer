using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Services.Impl.Estimations;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Estimations
{
    /// <summary>Fenêtres du solveur sans âmes, validées sur des attaques réelles (ville -7772).</summary>
    public class AttackComputationLegacyTests
    {
        private static EstimationsDto Top100(int min, int max) =>
            new() { _100 = new EstimationValueDto { Min = min, Max = max } };

        [Theory]
        [InlineData(9, 759, 841, 759, 830)]
        [InlineData(10, 1304, 1464, 1304, 1464)]
        [InlineData(11, 1414, 1565, 1414, 1520)]
        public void Window_from_the_top_row_matches_the_validated_real_attacks(int day, int min100, int max100, int expectedMin, int expectedMax)
        {
            var result = MyHordesOptimizerEstimationService.ComputeAttack(
                Top100(min100, max100), null, day, AttackDifficulty.Normal, (int)TownType.RE);

            result.Result.Min.Should().Be(expectedMin);
            result.Result.Max.Should().Be(expectedMax);
        }

        [Fact]
        public void Without_any_estimation_the_theoretical_bounds_of_the_day_are_returned()
        {
            var result = MyHordesOptimizerEstimationService.ComputeAttack(
                null, null, 9, AttackDifficulty.Normal, (int)TownType.RE);

            result.Result.Min.Should().Be(676);
            result.Result.Max.Should().Be(1185);
        }
    }
}
