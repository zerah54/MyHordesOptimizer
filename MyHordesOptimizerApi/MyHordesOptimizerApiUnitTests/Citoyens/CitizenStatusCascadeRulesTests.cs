using System.Collections.Generic;
using FluentAssertions;
using MyHordesOptimizerApi.Extensions;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Citoyens
{
    /// <summary>
    /// Cascades de statuts portées à la main depuis CitizenHandler::inflictStatus/removeStatus/
    /// healWound/setAP/increaseThirstLevel — voir section 6 du spec sous-projet B.
    /// </summary>
    public class CitizenStatusCascadeRulesTests
    {
        [Theory]
        [InlineData("thirst1", "hydrated")]
        [InlineData("thirst2", "hydrated")]
        [InlineData("drunk", "sober")]
        [InlineData("hungover", "sober")]
        [InlineData("drugged", "clean")]
        [InlineData("addict", "clean")]
        public void Inflict_PaireDExclusion_RetireLeStatutOppose(string ajoute, string retire)
        {
            var statuses = new HashSet<string> { retire, "tired" };

            CitizenStatusCascadeRules.Inflict(statuses, ajoute);

            statuses.Should().Contain(ajoute);
            statuses.Should().NotContain(retire);
            statuses.Should().Contain("tired");
        }

        [Fact]
        public void Inflict_StatutSansExclusion_AjouteSimplement()
        {
            var statuses = new HashSet<string>();

            CitizenStatusCascadeRules.Inflict(statuses, "haseaten");

            statuses.Should().ContainSingle().Which.Should().Be("haseaten");
        }

        [Theory]
        [InlineData("tg_meta_wound")]
        [InlineData("wound3")]
        public void Remove_MembreDeLaFamilleBlessure_PurgeToutLeGroupe(string membreRetire)
        {
            var statuses = new HashSet<string> { "tg_meta_wound", "wound3", "tired" };

            CitizenStatusCascadeRules.Remove(statuses, membreRetire);

            statuses.Should().NotContain("tg_meta_wound");
            statuses.Should().NotContain("wound3");
            statuses.Should().Contain("tired");
        }

        [Fact]
        public void Remove_StatutHorsFamilleBlessure_RetireSeulementLuiMeme()
        {
            var statuses = new HashSet<string> { "tired", "haseaten" };

            CitizenStatusCascadeRules.Remove(statuses, "tired");

            statuses.Should().ContainSingle().Which.Should().Be("haseaten");
        }

        [Fact]
        public void SyncTired_ApAZero_InfligeTired()
        {
            var statuses = new HashSet<string>();

            CitizenStatusCascadeRules.SyncTired(statuses, 0);

            statuses.Should().Contain("tired");
        }

        [Fact]
        public void SyncTired_ApQuitteZero_RetireTired()
        {
            var statuses = new HashSet<string> { "tired" };

            CitizenStatusCascadeRules.SyncTired(statuses, 1);

            statuses.Should().NotContain("tired");
        }

        [Fact]
        public void IncreaseThirstLevel_AucunStatutDeSoif_InfligeThirst1()
        {
            var statuses = new HashSet<string>();

            var mort = CitizenStatusCascadeRules.IncreaseThirstLevel(statuses);

            mort.Should().BeFalse();
            statuses.Should().Contain("thirst1");
        }

        [Fact]
        public void IncreaseThirstLevel_Thirst1Present_RemplaceParThirst2()
        {
            var statuses = new HashSet<string> { "thirst1" };

            var mort = CitizenStatusCascadeRules.IncreaseThirstLevel(statuses);

            mort.Should().BeFalse();
            statuses.Should().NotContain("thirst1");
            statuses.Should().Contain("thirst2");
        }

        [Fact]
        public void IncreaseThirstLevel_Thirst2Present_DeclencheLaMort()
        {
            var statuses = new HashSet<string> { "thirst2" };

            var mort = CitizenStatusCascadeRules.IncreaseThirstLevel(statuses);

            mort.Should().BeTrue();
        }
    }
}
