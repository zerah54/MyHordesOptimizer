using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Extensions;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Citoyens
{
    /// <summary>
    /// Formules portées à la main depuis BeyondController::desert_move_api et
    /// CitizenHandler::deductPointsWithFallback — voir section 6 du spec sous-projet B.
    /// </summary>
    public class CitizenMovementRulesTests
    {
        [Theory]
        [InlineData(true, PointType.Ap)]
        [InlineData(false, PointType.Sp)]
        public void GetPrimarySource_DependDeLaDistanceDeLaZone(bool isNearZone, PointType attendu)
        {
            CitizenMovementRules.GetPrimarySource(isNearZone).Should().Be(attendu);
        }

        [Fact]
        public void DeductWithFallback_PrimaireAp_Suffisant_DebiteSimplement()
        {
            var (ap, sp) = CitizenMovementRules.DeductWithFallback(ap: 5, sp: 2, primary: PointType.Ap, amount: 1);

            ap.Should().Be(4);
            sp.Should().Be(2);
        }

        [Fact]
        public void DeductWithFallback_PrimaireAp_Insuffisant_ClampeAZeroSansToucherAuSp()
        {
            var (ap, sp) = CitizenMovementRules.DeductWithFallback(ap: 0, sp: 2, primary: PointType.Ap, amount: 1);

            ap.Should().Be(0);
            sp.Should().Be(2);
        }

        [Fact]
        public void DeductWithFallback_PrimaireSp_Suffisant_NeTouchePasAuAp()
        {
            var (ap, sp) = CitizenMovementRules.DeductWithFallback(ap: 5, sp: 2, primary: PointType.Sp, amount: 1);

            ap.Should().Be(5);
            sp.Should().Be(1);
        }

        [Fact]
        public void DeductWithFallback_PrimaireSp_Insuffisant_PreleveLeManqueSurAp()
        {
            // SP=0, il manque 1 point -> prélevé sur l'AP (CitizenHandler::deductPointsWithFallback:525-540)
            var (ap, sp) = CitizenMovementRules.DeductWithFallback(ap: 5, sp: 0, primary: PointType.Sp, amount: 1);

            ap.Should().Be(4);
            sp.Should().Be(0);
        }

        [Fact]
        public void DeductWithFallback_PrimaireSp_InsuffisantEtApAussiInsuffisant_ClampeAZero()
        {
            var (ap, sp) = CitizenMovementRules.DeductWithFallback(ap: 0, sp: 0, primary: PointType.Sp, amount: 1);

            ap.Should().Be(0);
            sp.Should().Be(0);
        }
    }
}
