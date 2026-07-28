using System.Text;
using FluentAssertions;
using MyHordesOptimizerApi.Attributes;

namespace MyHordesOptimizerApiUnitTests.Securite
{
    /// <summary>
    /// Un en-tête d'authentification malformé doit être REFUSÉ, jamais faire tomber le serveur.
    /// Chacun des cas ci-dessous produisait un 500 avec trace complète, sans authentification
    /// préalable, sur les endpoints d'administration et d'import.
    /// </summary>
    public class BasicAuthenticationTests
    {
        private static string Encode(string valeur)
            => System.Convert.ToBase64String(Encoding.UTF8.GetBytes(valeur));

        [Fact]
        public void EnteteBasicValide_EstLu()
        {
            var identifiants = BasicAuthenticationAttribute.LireIdentifiants("Basic " + Encode("ReNacK:bonjour"));

            identifiants.Should().NotBeNull();
            identifiants!.Value.Nom.Should().Be("ReNacK");
            identifiants.Value.MotDePasse.Should().Be("bonjour");
        }

        [Fact]
        public void JetonBearer_EstRefuse_SansLever()
        {
            // Le cas réellement rencontré : un jeton Bearer envoyé à /DataImport/Items provoquait
            // `FormatException: The input is not a valid Base-64 string`, donc un 500.
            BasicAuthenticationAttribute.LireIdentifiants("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc")
                .Should().BeNull();
        }

        [Theory]
        [InlineData("")]
        [InlineData("Basic")]
        [InlineData("Bas")]
        public void EntetePlusCourtQueLePrefixe_EstRefuse_SansLever(string entete)
        {
            // `Substring(6)` levait ArgumentOutOfRangeException sur ces valeurs.
            BasicAuthenticationAttribute.LireIdentifiants(entete).Should().BeNull();
        }

        [Fact]
        public void EnteteBasicVide_EstRefuse()
        {
            BasicAuthenticationAttribute.LireIdentifiants("Basic ").Should().BeNull();
        }

        [Fact]
        public void Base64Invalide_EstRefuse_SansLever()
        {
            BasicAuthenticationAttribute.LireIdentifiants("Basic pas-du-base64-!!").Should().BeNull();
        }

        [Fact]
        public void BasicValideSansDeuxPoints_EstRefuse_SansLever()
        {
            // `cred[1]` levait IndexOutOfRangeException : il n'y avait qu'un élément.
            BasicAuthenticationAttribute.LireIdentifiants("Basic " + Encode("sansseparateur")).Should().BeNull();
        }

        [Fact]
        public void MotDePasseContenantDeuxPoints_EstConservéEntier()
        {
            // Le séparateur est le PREMIER deux-points. Découper sur tous tronquerait un mot de
            // passe parfaitement valide — et le refus qui s'ensuivrait serait incompréhensible.
            var identifiants = BasicAuthenticationAttribute.LireIdentifiants("Basic " + Encode("admin:mot:de:passe"));

            identifiants.Should().NotBeNull();
            identifiants!.Value.Nom.Should().Be("admin");
            identifiants.Value.MotDePasse.Should().Be("mot:de:passe");
        }

        [Fact]
        public void PrefixeInsensibleALaCasse()
        {
            // La RFC 7617 ne prescrit pas la casse du schéma ; des clients envoient « basic ».
            BasicAuthenticationAttribute.LireIdentifiants("basic " + Encode("a:b")).Should().NotBeNull();
        }
    }
}
