using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Search
{
    /// <summary>
    /// Recherche de l'annuaire : bornes du nombre de résultats et échappement de la saisie dans les
    /// motifs LIKE (les requêtes elles-mêmes ne tournent que sur MySQL).
    /// </summary>
    public class DirectorySearchServiceTests
    {
        [Theory]
        [InlineData(null, DirectorySearchService.DefaultLimit)]
        [InlineData(0, DirectorySearchService.DefaultLimit)]
        [InlineData(-3, DirectorySearchService.DefaultLimit)]
        [InlineData(1, 1)]
        [InlineData(20, 20)]
        [InlineData(500, DirectorySearchService.MaxLimit)]
        public void Nombre_de_resultats_borne(int? limit, int expected)
        {
            DirectorySearchService.ClampLimit(limit).Should().Be(expected);
        }

        [Theory]
        [InlineData("Zerah", "Zerah")]
        [InlineData("100%", "100\\%")]
        [InlineData("a_b", "a\\_b")]
        [InlineData("c:\\x", "c:\\\\x")]
        public void Jokers_de_like_echappes(string term, string expected)
        {
            DirectorySearchService.EscapeLikePattern(term).Should().Be(expected);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData(" z ")]
        public void Saisie_trop_courte_sans_requete(string? query)
        {
            // Aucune requête n'est lancée : un contexte nul prouve qu'il n'est pas lu.
            DirectorySearchService service = new DirectorySearchService(null!);

            var result = service.Search(query, null);

            result.Players.Items.Should().BeEmpty();
            result.Players.Total.Should().Be(0);
            result.Towns.Items.Should().BeEmpty();
            result.Towns.Total.Should().Be(0);
        }
    }
}
