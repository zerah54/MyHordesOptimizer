using FluentAssertions;
using MyHordesOptimizerApi.Models.Translation;
using MyHordesOptimizerApi.Services.Impl.Translations;

namespace MyHordesOptimizerApiUnitTests.Translations
{
    /// <summary>
    /// « Verteidigung » existe dans buildings, game et items (« en défense », « Défenses », « Défense ») :
    /// sans domaine, le premier fichier rencontré gagne, ce qui donnait « en défense » à la catégorie Armor.
    /// </summary>
    public class YmlTranslationLookupTests
    {
        private static Dictionary<string, List<YmlTranslationFileModel>> Fichiers() => new()
        {
            ["fr"] = new List<YmlTranslationFileModel>
            {
                Fichier("translations/buildings+intl-icu.fr.yml", "en défense"),
                Fichier("translations/game+intl-icu.fr.yml", "Défenses"),
                Fichier("translations/items+intl-icu.fr.yml", "Défense"),
            }
        };

        private static YmlTranslationFileModel Fichier(string nom, string traduction) => new()
        {
            Name = nom,
            DestinationLocale = "fr",
            Translations = new Dictionary<string, string> { ["Verteidigung"] = traduction }
        };

        [Theory]
        [InlineData("buildings", "en défense")]
        [InlineData("game", "Défenses")]
        [InlineData("items", "Défense")]
        public void Find_IgnoreLesFichiersDesAutresDomaines(string domaine, string attendu)
        {
            YmlTranslationLookup.Find(Fichiers(), "fr", "Verteidigung", domaine).Should().Be(attendu);
        }

        [Fact]
        public void Find_DomaineAbsent_RendNull()
        {
            YmlTranslationLookup.Find(Fichiers(), "fr", "Verteidigung", "admin").Should().BeNull();
        }

        [Fact]
        public void Find_LangueAbsente_RendNull()
        {
            YmlTranslationLookup.Find(Fichiers(), "ja", "Verteidigung", "items").Should().BeNull();
        }

        [Fact]
        public void Find_DomaineSansLaCle_RendNull()
        {
            YmlTranslationLookup.Find(Fichiers(), "fr", "Inconnu", "items").Should().BeNull();
        }
    }
}
