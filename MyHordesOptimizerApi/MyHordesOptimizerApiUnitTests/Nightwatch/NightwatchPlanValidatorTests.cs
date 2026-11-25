using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Services.Impl.Nightwatch;
using System.Collections.Generic;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Nightwatch
{
    public class NightwatchPlanValidatorTests
    {
        private static NightwatchPlanContentDto ContentWith(params NightwatchWatcherDto[] watchers) => new() { Watchers = new List<NightwatchWatcherDto>(watchers) };

        [Theory]
        [InlineData("  Plan A  ", "Plan A")]
        [InlineData("Plan B 🧟", "Plan B 🧟")]
        public void NormalizeName_TrimsAndAcceptsEmoji(string input, string expected)
        {
            NightwatchPlanValidator.NormalizeName(input).Should().Be(expected);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void NormalizeName_RejectsEmpty(string? input)
        {
            var act = () => NightwatchPlanValidator.NormalizeName(input);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void NormalizeName_RejectsMoreThan64Characters()
        {
            var act = () => NightwatchPlanValidator.NormalizeName(new string('a', 65));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-3)]
        public void ValidateDay_RejectsBeforeTheFirstDay(int day)
        {
            var act = () => NightwatchPlanValidator.ValidateDay(day);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_AcceptsAnEmptyContent()
        {
            NightwatchPlanValidator.SerializeContent(new NightwatchPlanContentDto()).Should().Contain("\"Watchers\":[]");
        }

        [Fact]
        public void SerializeContent_KeepsTheChosenBuildingPlan()
        {
            NightwatchPlanValidator.SerializeContent(new NightwatchPlanContentDto { BuildingPlanId = 70 }).Should().Contain("\"BuildingPlanId\":70");
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void SerializeContent_RejectsAnInvalidBuildingPlan(int building_plan_id)
        {
            var act = () => NightwatchPlanValidator.SerializeContent(new NightwatchPlanContentDto { BuildingPlanId = building_plan_id });
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_AcceptsAFullWatcher()
        {
            var watcher = new NightwatchWatcherDto
            {
                UserId = 12,
                Statuses = { "drugged", "dogSteak", "ghoul" },
                Items = { { 4, 2 } },
                PastWatches = 3,
                HasDiscourse = true,
                Note = "Monter tôt"
            };

            var act = () => NightwatchPlanValidator.SerializeContent(ContentWith(watcher));

            act.Should().NotThrow();
        }

        [Fact]
        public void SerializeContent_RejectsNull()
        {
            var act = () => NightwatchPlanValidator.SerializeContent(null);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsADuplicatedWatcher()
        {
            var act = () => NightwatchPlanValidator.SerializeContent(ContentWith(new NightwatchWatcherDto { UserId = 1 }, new NightwatchWatcherDto { UserId = 1 }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsAnUnknownStatus()
        {
            var act = () => NightwatchPlanValidator.SerializeContent(ContentWith(new NightwatchWatcherDto { UserId = 1, Statuses = { "flying" } }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void SerializeContent_RejectsANonPositiveItemQuantity(int quantity)
        {
            var act = () => NightwatchPlanValidator.SerializeContent(ContentWith(new NightwatchWatcherDto { UserId = 1, Items = { { 4, quantity } } }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsANegativePastWatchesCount()
        {
            var act = () => NightwatchPlanValidator.SerializeContent(ContentWith(new NightwatchWatcherDto { UserId = 1, PastWatches = -1 }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsANegativeManualStock()
        {
            var act = () => NightwatchPlanValidator.SerializeContent(new NightwatchPlanContentDto { ManualStock = { { 4, -1 } } });
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_KeepsSimulationFields()
        {
            var content = new NightwatchPlanContentDto
            {
                GlobalItems = new Dictionary<int, int> { { 5, 3 } },
                CityDefense = new NightwatchCityDefenseDto { Wall = 10, AdLevel = 2, FddCoefficient = 1.5 },
                AllowedOverflow = 275
            };
            var json = NightwatchPlanValidator.SerializeContent(content);
            json.Should().Contain("\"GlobalItems\":{\"5\":3}").And.Contain("\"Wall\":10").And.Contain("\"AdLevel\":2").And.Contain("\"AllowedOverflow\":275");
        }

        [Theory]
        [InlineData("adHigh")]
        [InlineData("adLow")]
        [InlineData("reduction")]
        [InlineData("negItem")]
        [InlineData("overflow")]
        [InlineData("overflowHigh")]
        [InlineData("reactorHigh")]
        [InlineData("wallNeg")]
        [InlineData("homesHigh")]
        [InlineData("fddNeg")]
        [InlineData("fddTooHigh")]
        [InlineData("fddNaN")]
        [InlineData("fddInf")]
        public void SerializeContent_RejectsInvalidSimulationFields(string kind)
        {
            var content = new NightwatchPlanContentDto();
            switch (kind)
            {
                case "adHigh": content.CityDefense = new NightwatchCityDefenseDto { AdLevel = 4 }; break;
                case "adLow": content.CityDefense = new NightwatchCityDefenseDto { AdLevel = -2 }; break;
                case "reduction": content.AttackReductionPercent = 101; break;
                case "negItem": content.GlobalItems = new Dictionary<int, int> { { 5, -1 } }; break;
                case "overflow": content.AllowedOverflow = -1; break;
                case "overflowHigh": content.AllowedOverflow = 100001; break;
                case "reactorHigh": content.ReactorDamage = 100001; break;
                case "wallNeg": content.CityDefense = new NightwatchCityDefenseDto { Wall = -1 }; break;
                case "homesHigh": content.CityDefense = new NightwatchCityDefenseDto { Homes = 100001 }; break;
                case "fddNeg": content.CityDefense = new NightwatchCityDefenseDto { FddCoefficient = -0.5 }; break;
                case "fddTooHigh": content.CityDefense = new NightwatchCityDefenseDto { FddCoefficient = 10.5 }; break;
                case "fddNaN": content.CityDefense = new NightwatchCityDefenseDto { FddCoefficient = double.NaN }; break;
                case "fddInf": content.CityDefense = new NightwatchCityDefenseDto { FddCoefficient = double.PositiveInfinity }; break;
            }
            var act = () => NightwatchPlanValidator.SerializeContent(content);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void ValidateSimulation_RejectsALastDayBeforeToday()
        {
            var request = new NightwatchSimulationRequestDto { Name = "Sim", LastDay = 9 };
            var act = () => NightwatchPlanValidator.ValidateSimulation(request, 10);
            act.Should().Throw<MhoTechnicalException>();
            request.LastDay = 10;
            act = () => NightwatchPlanValidator.ValidateSimulation(request, 10);
            act.Should().NotThrow();
        }
    }
}
