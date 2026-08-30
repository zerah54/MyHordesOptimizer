using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Extensions;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Citoyens
{
    /// <summary>
    /// Formules portées à la main depuis CitizenHandler::getMaxAP/getMaxSP/setAP et
    /// ProcessStatusEffect::__invoke (commit c05060df09aadead4685ff629a0bc97af9ae079e) — voir
    /// section 8 du spec pour la procédure de mise à jour si le jeu change ces règles.
    /// </summary>
    public class CitizenPointRulesTests
    {
        [Theory]
        [InlineData(false, 6)]
        [InlineData(true, 5)]
        public void GetMaxAp_DependUniquementDeLaBlessure(bool wounded, int attendu)
        {
            CitizenPointRules.GetMaxAp(wounded).Should().Be(attendu);
        }

        [Theory]
        [InlineData(false, false, false, 0)]
        [InlineData(true, false, false, 2)]
        [InlineData(false, true, false, 2)]
        [InlineData(false, false, true, 1)]
        [InlineData(true, true, false, 4)]
        [InlineData(true, false, true, 3)]
        [InlineData(false, true, true, 3)]
        [InlineData(true, true, true, 5)]
        public void GetMaxSp_CumuleEclaireurVeloEtBaskets(
            bool isEclaireur, bool hasBike, bool hasShoes, int attendu)
        {
            CitizenPointRules.GetMaxSp(isEclaireur, hasBike, hasShoes).Should().Be(attendu);
        }

        [Fact]
        public void ApplyPointEffect_RelatifAuMax_RemonteAuMaxPlusBonus()
        {
            // eat_ap7 : pointValue=1, relatif au max -> 6 PA max + 1 = 7, depuis un état bas.
            var resultat = CitizenPointRules.ApplyPointEffect(
                currentValue: 2, maxValue: 6, relativeToMax: RelativeMaxPoint.RelativeToMax,
                pointValue: 1, capAt: null, exceedMax: null);

            resultat.Should().Be(7);
        }

        [Fact]
        public void ApplyPointEffect_RelatifAuMax_NeRedescendJamaisUnEtatDejaSuperieur()
        {
            // Citoyen à 8 PA (boosté par une drogue) qui mange eat_ap6 (remonte à 6) : reste à 8.
            var resultat = CitizenPointRules.ApplyPointEffect(
                currentValue: 8, maxValue: 6, relativeToMax: RelativeMaxPoint.RelativeToMax,
                pointValue: 0, capAt: null, exceedMax: null);

            resultat.Should().Be(8);
        }

        [Fact]
        public void ApplyPointEffect_Absolu_DepuisUnEtatBas_PlafonneAuMaxMalgreLeLitteral()
        {
            // eat_ap4 (mauvaise nourriture) : +4 littéral, mais exceedMax=0 -> plafonné à 6, pas 9.
            var resultat = CitizenPointRules.ApplyPointEffect(
                currentValue: 5, maxValue: 6, relativeToMax: RelativeMaxPoint.Absolute,
                pointValue: 4, capAt: null, exceedMax: 0);

            resultat.Should().Be(6);
        }

        [Fact]
        public void ApplyPointEffect_Absolu_EtatDejaAuDessusDuMax_EstPreserveNonReduit()
        {
            var resultat = CitizenPointRules.ApplyPointEffect(
                currentValue: 8, maxValue: 6, relativeToMax: RelativeMaxPoint.Absolute,
                pointValue: 4, capAt: null, exceedMax: 0);

            resultat.Should().Be(8);
        }

        [Fact]
        public void ApplyPointEffect_Absolu_EffetNegatif_NEstPasPlafonneParExceedMax()
        {
            var resultat = CitizenPointRules.ApplyPointEffect(
                currentValue: 6, maxValue: 6, relativeToMax: RelativeMaxPoint.Absolute,
                pointValue: -3, capAt: null, exceedMax: 0);

            resultat.Should().Be(3);
        }

        [Fact]
        public void ApplyPointEffect_RelatifAuMaxExtension_ExcluLaBaseEclaireur()
        {
            // eat_ap6 sur le PE : maxValue passé par l'appelant DOIT déjà exclure le bonus
            // Éclaireur (RelativeToExtensionMax) — ici un citoyen Éclaireur+vélo (max PE réel 4)
            // dont seule la part vélo (2) est passée en maxValue.
            var resultat = CitizenPointRules.ApplyPointEffect(
                currentValue: 0, maxValue: 2, relativeToMax: RelativeMaxPoint.RelativeToExtensionMax,
                pointValue: 0, capAt: null, exceedMax: null);

            resultat.Should().Be(2);
        }
    }
}
