using System.Collections.Generic;
using FluentAssertions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models.CitizenState;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Citoyens
{
    /// <summary>
    /// Formule portée à la main depuis CitizenHandler::getCP (CitizenHandler.php:542-577) — voir
    /// docs/superpowers/specs/2026-08-20-pdc-state-manager-design.md section 2 pour la procédure de
    /// mise à jour si le jeu change cette règle.
    /// </summary>
    public class CitizenPdcRulesTests
    {
        [Fact]
        public void ComputeCurrentPdc_EtatNu_RenvoieLaBaseDeDeux()
        {
            var state = new CitizenState();

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(2);
        }

        [Fact]
        public void ComputeCurrentPdc_Terror_EcraseTousLesBonusAZero()
        {
            var state = new CitizenState
            {
                HasShield = true,
                HasDefenceCpItem = true,
                IsGuide = true,
                ZoneCitizenCount = 5,
                HasBaseZoneControlPerk = true,
                Statuses = new HashSet<string> { "terror" },
            };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(0);
        }

        [Fact]
        public void ComputeCurrentPdc_Bouclier_AjouteDeux()
        {
            var state = new CitizenState { HasShield = true };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(4);
        }

        [Fact]
        public void ComputeCurrentPdc_ObjetDefenceCp_AjouteUn()
        {
            var state = new CitizenState { HasDefenceCpItem = true };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(3);
        }

        [Fact]
        public void ComputeCurrentPdc_Guide_AjouteLeNombreDeCitoyensDeLaZone()
        {
            var state = new CitizenState { IsGuide = true, ZoneCitizenCount = 5 };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(7);
        }

        [Fact]
        public void ComputeCurrentPdc_ZoneCitizenCountSansGuide_NAjouteRien()
        {
            var state = new CitizenState { IsGuide = false, ZoneCitizenCount = 5 };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(2);
        }

        [Fact]
        public void ComputeCurrentPdc_PerkBaseZoneControl_AjouteUnInconditionnellement()
        {
            var state = new CitizenState { HasBaseZoneControlPerk = true };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(3);
        }

        [Theory]
        [InlineData(false, 3)] // ni drugged ni addict : bonus clean s'applique
        [InlineData(true, 2)]  // drugged présent : bonus clean ne s'applique pas
        public void ComputeCurrentPdc_PerkClean_DependDuStatutDrugged(bool drugged, int attendu)
        {
            var state = new CitizenState { HasCleanPdcPerk = true };
            if (drugged) state.Statuses.Add("drugged");

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(attendu);
        }

        [Fact]
        public void ComputeCurrentPdc_PerkClean_NeSAppliquePasSiAddict()
        {
            var state = new CitizenState { HasCleanPdcPerk = true, Statuses = new HashSet<string> { "addict" } };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(2);
        }

        [Theory]
        [InlineData("thirst1")]
        [InlineData("thirst2")]
        public void ComputeCurrentPdc_PerkHydrate_NeSAppliquePasSiAssoiffe(string statut)
        {
            var state = new CitizenState { HasHydratedPdcPerk = true, Statuses = new HashSet<string> { statut } };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(2);
        }

        [Fact]
        public void ComputeCurrentPdc_PerkHydrate_SAppliqueSiNiThirst1NiThirst2()
        {
            var state = new CitizenState { HasHydratedPdcPerk = true };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(3);
        }

        [Theory]
        [InlineData("drunk")]
        [InlineData("hungover")]
        public void ComputeCurrentPdc_PerkSobre_NeSAppliquePasSiIvreOuGueuleDeBois(string statut)
        {
            var state = new CitizenState { HasSoberPdcPerk = true, Statuses = new HashSet<string> { statut } };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(2);
        }

        [Fact]
        public void ComputeCurrentPdc_PerkSobre_SAppliqueSiNiDrunkNiHungover()
        {
            var state = new CitizenState { HasSoberPdcPerk = true };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(3);
        }

        [Fact]
        public void ComputeCurrentPdc_TousLesBonusCumulesSansPerks_AdditionneCorrectement()
        {
            var state = new CitizenState
            {
                HasShield = true,       // +2
                HasDefenceCpItem = true, // +1
                IsGuide = true,
                ZoneCitizenCount = 3,    // +3
            };

            CitizenPdcRules.ComputeCurrentPdc(state).Should().Be(8); // 2 + 2 + 1 + 3
        }
    }
}
