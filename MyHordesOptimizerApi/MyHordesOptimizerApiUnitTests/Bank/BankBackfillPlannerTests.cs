using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.Bank;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Bank
{
    public class BankBackfillPlannerTests
    {
        private static readonly DateTime Now = new(2026, 11, 20, 12, 0, 0, DateTimeKind.Utc);

        private static int Offset() => BankDayAnchor.ResolveOffset(new[] { (new DateTime(2026, 11, 10, 10, 0, 0, DateTimeKind.Utc), 5) })!.Value;

        private static ExistingPhoto P(int id, DateTime utc, string hash) => new(id, utc, hash);

        private static DateTime U(int month, int day, int hour) => new(2026, month, day, hour, 0, 0, DateTimeKind.Utc);

        private static Dictionary<int, int?> Plan(IReadOnlyList<ExistingPhoto> photos, int? offset, int townDay)
            => BankBackfillPlanner.PlanTown(photos, offset, townDay, Now).ToDictionary(d => d.IdLastUpdateInfo, d => d.Day);

        [Fact]
        public void SansPhoto_AucuneDecision()
        {
            BankBackfillPlanner.PlanTown(new List<ExistingPhoto>(), Offset(), 6, Now).Should().BeEmpty();
        }

        [Fact]
        public void JoursEcoules_GardeLaDerniereDuJour()
        {
            var photos = new[] { P(1, U(11, 10, 8), "h1"), P(2, U(11, 10, 20), "h2"), P(3, U(11, 11, 9), "h3") };

            Plan(photos, Offset(), 6).Should().BeEquivalentTo(new Dictionary<int, int?> { [1] = null, [2] = 5, [3] = 6 });
        }

        [Fact]
        public void JourCourant_SupprimeLesDoublonsConsecutifs_GardeLePremier()
        {
            var photos = new[]
            {
                P(3, U(11, 11, 9), "h3"), P(4, U(11, 11, 10), "h3"),
                P(5, U(11, 11, 11), "h4"), P(6, U(11, 11, 12), "h3"),
            };

            Plan(photos, Offset(), 6).Should().BeEquivalentTo(
                new Dictionary<int, int?> { [3] = 6, [4] = null, [5] = 6, [6] = 6 });
        }

        [Fact]
        public void JourHorsBornes_EstBorne()
        {
            var photos = new[] { P(1, U(11, 5, 10), "h1"), P(2, U(11, 14, 10), "h2") };

            Plan(photos, Offset(), 6).Should().BeEquivalentTo(new Dictionary<int, int?> { [1] = 1, [2] = 6 });
        }

        [Fact]
        public void SansAncre_PhotoRecente_AncreSurTownDay()
        {
            var photos = new[] { P(1, Now.AddHours(-26), "h1"), P(2, Now.AddHours(-2), "h2") };

            Plan(photos, null, 8).Should().BeEquivalentTo(new Dictionary<int, int?> { [1] = 7, [2] = 8 });
        }

        [Fact]
        public void SansAncre_PhotoAncienne_SeuleLaDerniereEstGardee()
        {
            var photos = new[] { P(1, Now.AddDays(-5), "h1"), P(2, Now.AddDays(-4), "h2"), P(3, Now.AddDays(-3), "h3") };

            Plan(photos, null, 8).Should().BeEquivalentTo(new Dictionary<int, int?> { [1] = null, [2] = null, [3] = 8 });
        }
    }
}
