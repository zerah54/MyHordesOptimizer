using System.Collections.Generic;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Services.Impl.Estimations;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Estimations
{
    public class AttackSoulsDefaultsTests
    {
        private static EstimationValueDto Value() => new() { Min = 3000, Max = 4000 };

        [Fact]
        public void Uses_the_highest_filled_tower_row_and_the_tower_SPA_level()
        {
            var tdg = new EstimationRequestDto { Estim = new EstimationsDto { _33 = Value(), _50 = Value() }, EstimSouls = new Dictionary<int, int> { [33] = 1, [50] = 2 }, EstimSpaLevel = 2 };
            AttackSoulsDefaults.Resolve(tdg, new EstimationRequestDto(), new AttackSettingsDto()).Should().Be((2, 2));
        }

        [Fact]
        public void Falls_back_on_the_planner_of_the_day_before_without_tower_rows()
        {
            var planif = new EstimationRequestDto { Planif = new EstimationsDto { _0 = Value(), _8 = Value() }, PlanifSouls = new Dictionary<int, int> { [8] = 3 }, PlanifSpaLevel = 1 };
            AttackSoulsDefaults.Resolve(new EstimationRequestDto(), planif, new AttackSettingsDto()).Should().Be((3, 1));
        }

        [Fact]
        public void Stored_settings_win_over_the_defaults()
        {
            var tdg = new EstimationRequestDto { Estim = new EstimationsDto { _33 = Value() }, EstimSouls = new Dictionary<int, int> { [33] = 1 } };
            AttackSoulsDefaults.Resolve(tdg, new EstimationRequestDto(), new AttackSettingsDto { Souls = 0, SpaLevel = 3 }).Should().Be((0, 3));
        }

        [Fact]
        public void Defaults_tell_which_family_they_come_from()
        {
            var tdg = new EstimationRequestDto { Estim = new EstimationsDto { _33 = Value() }, EstimSouls = new Dictionary<int, int> { [33] = 1 }, EstimSpaLevel = 2 };
            var planif = new EstimationRequestDto { Planif = new EstimationsDto { _8 = Value() }, PlanifSouls = new Dictionary<int, int> { [8] = 3 }, PlanifSpaLevel = 1 };

            AttackSoulsDefaults.Defaults(tdg, planif).Should().Be((1, 2, true));
            AttackSoulsDefaults.Defaults(new EstimationRequestDto(), planif).Should().Be((3, 1, false));
        }

        [Fact]
        public void Without_any_row_nor_setting_returns_no_soul() =>
            AttackSoulsDefaults.Resolve(new EstimationRequestDto(), new EstimationRequestDto(), new AttackSettingsDto()).Should().Be((0, 0));
    }
}
