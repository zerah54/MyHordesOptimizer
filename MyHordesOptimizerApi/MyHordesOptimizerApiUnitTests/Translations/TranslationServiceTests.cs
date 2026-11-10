using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Models.Translation;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Translations;

namespace MyHordesOptimizerApiUnitTests.Translations
{
    /// <summary>
    /// Les fichiers de chaque langue ne sont pas synchronisés : une nouvelle clé allemande apparaît dans le fichier
    /// <c>de</c> avant d'être traduite dans les autres.
    /// </summary>
    public class TranslationServiceTests
    {
        private const string Cle = "Der Beruf des Einsiedlers";

        private sealed class FakeRepository(Dictionary<string, List<YmlTranslationFileModel>> fichiers) : ITranslastionRepository
        {
            public Task<Dictionary<string, List<YmlTranslationFileModel>>> GetTranslationAsync() => Task.FromResult(fichiers);
        }

        private static YmlTranslationFileModel Fichier(string langue, Dictionary<string, string> traductions) => new()
        {
            Name = $"translations/help+intl-icu.{langue}.yml",
            DestinationLocale = langue,
            Translations = traductions
        };

        private static TranslationService Service(bool avecFichierEn) => new(NullLogger<TranslationService>.Instance, new FakeRepository(new()
        {
            ["de"] = [Fichier("de", new() { [Cle] = Cle })],
            ["fr"] = [Fichier("fr", new() { [Cle] = "Le métier d'Ermite" })],
            ["es"] = [Fichier("es", new() { [Cle] = "El oficio Ermitaño" })],
            ["en"] = avecFichierEn ? [Fichier("en", new() { ["Autre clé"] = "Other key" })] : []
        }));

        [Theory]
        [InlineData("de", "Einsiedl", true)]
        [InlineData("fr", "Ermite", true)]
        [InlineData("de", "Einsiedl", false)]
        [InlineData("fr", "Ermite", false)]
        public async Task GetTranslationAsync_TraductionAbsenteDUneLangue_RendLesAutres(string langue, string recherche, bool avecFichierEn)
        {
            var resultat = await Service(avecFichierEn).GetTranslationAsync(langue, recherche);

            var traduction = resultat.Translations.Should().ContainSingle().Subject.Value;
            traduction.En.Should().BeEmpty();
            traduction.Fr.Should().Equal("Le métier d'Ermite");
            traduction.Es.Should().Equal("El oficio Ermitaño");
            traduction.De.Should().Equal(Cle);
        }
    }
}
