using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.Bank;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Bank
{
    public class BankDayAnchorTests
    {
        private static DateTime Utc(int y, int m, int d, int h, int min) => new(y, m, d, h, min, 0, DateTimeKind.Utc);

        [Fact]
        public void DateOf_EteApres22hUtc_EstLeLendemain()
            => ParisCalendar.DateOf(Utc(2026, 7, 20, 22, 30)).Should().Be(new DateOnly(2026, 7, 21));

        [Fact]
        public void DateOf_HiverAvant23hUtc_EstLeMemeJour()
            => ParisCalendar.DateOf(Utc(2026, 1, 10, 22, 30)).Should().Be(new DateOnly(2026, 1, 10));

        [Fact]
        public void DateOf_NuitDuChangementDHeure()
        {
            ParisCalendar.DateOf(Utc(2026, 10, 24, 22, 30)).Should().Be(new DateOnly(2026, 10, 25));
            ParisCalendar.DateOf(Utc(2026, 10, 25, 22, 30)).Should().Be(new DateOnly(2026, 10, 25));
        }

        [Fact]
        public void DateOf_Unspecified_EstLuCommeUtc()
            => ParisCalendar.DateOf(new DateTime(2026, 7, 20, 22, 30, 0, DateTimeKind.Unspecified)).Should().Be(new DateOnly(2026, 7, 21));

        [Fact]
        public void ResolveOffset_SansPaire_Null()
            => BankDayAnchor.ResolveOffset(Array.Empty<(DateTime, int)>()).Should().BeNull();

        [Fact]
        public void ResolveOffset_PrendLEcartMajoritaire()
        {
            var offset = BankDayAnchor.ResolveOffset(new[]
            {
                (Utc(2026, 11, 10, 10, 0), 5),
                (Utc(2026, 11, 11, 10, 0), 6),
                (Utc(2026, 11, 11, 10, 0), 5),
            });

            offset.Should().NotBeNull();
            BankDayAnchor.DayOf(offset!.Value, Utc(2026, 11, 12, 8, 0)).Should().Be(7);
        }

        [Fact]
        public void ResolveOffset_Egalite_PrendLePlusPetitEcart()
        {
            var a = (Utc(2026, 11, 11, 10, 0), 6);
            var b = (Utc(2026, 11, 11, 10, 0), 5);
            var expected = ParisCalendar.DateOf(a.Item1).DayNumber - 6;

            BankDayAnchor.ResolveOffset(new[] { b, a }).Should().Be(expected);
        }
    }
}
