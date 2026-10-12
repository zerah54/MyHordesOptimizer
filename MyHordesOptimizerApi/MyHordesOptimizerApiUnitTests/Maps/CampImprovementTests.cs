using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.Maps;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Maps
{
    /// <summary>Aménagement d'une zone pour le camping : -15 par nuit, sans descendre sous 0.</summary>
    public class CampImprovementTests
    {
        [Fact]
        public void CurrentLevel_RienDeSaisi_Null()
        {
            CampImprovement.CurrentLevel(null, null, 5).Should().BeNull();
            CampImprovement.CurrentLevel(30, null, 5).Should().BeNull();
        }

        [Theory]
        [InlineData(40, 5, 5, 40)]
        [InlineData(40, 4, 5, 25)]
        [InlineData(40, 3, 5, 10)]
        [InlineData(40, 1, 5, 0)]
        // Saisie datée d'un jour à venir (ville pas encore synchronisée) : pas de nuit à retirer
        [InlineData(40, 6, 5, 40)]
        public void CurrentLevel_RetireQuinzeParNuit_SansDescendreSousZero(int level, int day, int currentDay, int expected)
        {
            CampImprovement.CurrentLevel(level, day, currentDay).Should().Be(expected);
        }

        [Fact]
        public void Apply_AjouteAmeliorationsEtObjetsDeDefense_AuNiveauCourant()
        {
            CampImprovement.Apply(10, null, 1, 2, 5, 9).Should().Be(33);
            CampImprovement.Apply(null, null, 2, 0, 5, 9).Should().Be(10);
        }

        [Fact]
        public void Apply_NiveauConstate_RemplaceLeNiveauConnu()
        {
            CampImprovement.Apply(50, 12, 1, 0, 5, 9).Should().Be(17);
            CampImprovement.Apply(50, 0, 0, 0, 5, 9).Should().Be(0);
        }

        [Fact]
        public void Apply_Annulation_SansDescendreSousZero()
        {
            CampImprovement.Apply(14, null, 0, -1, 5, 9).Should().Be(5);
            CampImprovement.Apply(5, null, -2, 0, 5, 9).Should().Be(0);
        }

        [Fact]
        public void Apply_PasDePlafond()
        {
            // Le jeu n'améliore que sous 50, mais c'est la saisie du joueur qui fait foi
            CampImprovement.Apply(49, null, 0, 1, 5, 9).Should().Be(58);
            CampImprovement.Apply(58, null, 1, 0, 5, 9).Should().Be(63);
        }
    }
}
