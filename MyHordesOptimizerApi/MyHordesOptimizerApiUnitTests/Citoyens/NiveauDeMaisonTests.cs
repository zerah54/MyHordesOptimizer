using FluentAssertions;
using MyHordesOptimizerApi.Extensions;

namespace MyHordesOptimizerApiUnitTests.Citoyens
{
    /// <summary>
    /// Le niveau de maison se déduit de <c>baseDef</c>, que MyHordes sert pour tous les citoyens :
    /// il n'a jamais eu à être saisi à la main.
    /// </summary>
    public class NiveauDeMaisonTests
    {
        [Theory]
        [InlineData(0, 0)]
        [InlineData(1, 1)]
        [InlineData(4, 2)]
        [InlineData(9, 3)]
        [InlineData(16, 4)]
        [InlineData(25, 5)]
        [InlineData(36, 6)]
        [InlineData(49, 7)]
        [InlineData(64, 8)]
        public void ChaqueDefenseDeFixtureDonneSonNiveau(int defense, int niveauAttendu)
        {
            // Valeurs reprises de CitizenHomeLevelDataService : 0 Lit de camp … 8 Château.
            MyHordesExtensions.NiveauDeMaisonDepuisDefense(defense).Should().Be(niveauAttendu);
        }

        [Fact]
        public void DefenseZero_DonneNiveauZero_EtNonNull()
        {
            // Le niveau 0 (lit de camp) est un vrai niveau, pas une absence de donnée. Le confondre
            // avec « inconnu » ferait disparaître de l'affichage les citoyens qui n'ont rien bâti.
            MyHordesExtensions.NiveauDeMaisonDepuisDefense(0).Should().Be(0);
        }

        [Fact]
        public void DefenseAbsente_DonneNull()
        {
            // MyHordes n'a rien transmis : on ne devine pas.
            MyHordesExtensions.NiveauDeMaisonDepuisDefense(null).Should().BeNull();
        }

        [Theory]
        [InlineData(81)]
        [InlineData(100)]
        public void DefenseDUnNiveauQueLeJeuAjouterait_DonneNull_PlutotQuUneRacineSilencieuse(int defense)
        {
            // 81 = 9², donc Math.Sqrt donnerait « niveau 9 » sans que personne ne s'aperçoive que la
            // table du jeu a changé. La table explicite, elle, dit « je ne sais pas ».
            MyHordesExtensions.NiveauDeMaisonDepuisDefense(defense).Should().BeNull();
        }

        [Theory]
        [InlineData(2)]
        [InlineData(50)]
        [InlineData(-1)]
        public void DefenseIncoherente_DonneNull(int defense)
        {
            MyHordesExtensions.NiveauDeMaisonDepuisDefense(defense).Should().BeNull();
        }
    }
}
