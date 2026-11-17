using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
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
    }
}
