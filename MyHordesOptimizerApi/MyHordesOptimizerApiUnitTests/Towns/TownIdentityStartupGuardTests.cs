using System;
using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.Towns;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Towns
{
    public class TownIdentityStartupGuardTests
    {
        [Theory]
        [InlineData(false, false)]
        [InlineData(true, true)]
        public void StartupGuard_MarqueurEtCodeAccordes_Demarre(bool markerPresent, bool codeExpectsMigratedKeys)
        {
            var act = () => TownIdentityStartupGuard.Check(markerPresent, codeExpectsMigratedKeys);

            act.Should().NotThrow();
        }

        [Fact]
        public void StartupGuard_CodeAncienMarqueurPresent_Refuse()
        {
            var act = () => TownIdentityStartupGuard.Check(markerPresent: true, codeExpectsMigratedKeys: false);

            act.Should().Throw<InvalidOperationException>().WithMessage("*TownKeysMigrated*");
        }

        [Fact]
        public void StartupGuard_CodeNeufMarqueurAbsent_Refuse()
        {
            var act = () => TownIdentityStartupGuard.Check(markerPresent: false, codeExpectsMigratedKeys: true);

            act.Should().Throw<InvalidOperationException>().WithMessage("*TownKeysMigrated*");
        }
    }
}
