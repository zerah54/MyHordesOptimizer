using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordes;
using Newtonsoft.Json;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    /// <summary>
    /// MyHordes renvoie tantôt une URL, tantôt le BOOLÉEN <c>false</c>, tantôt rien, pour dire la
    /// même chose : ce joueur n'a pas d'avatar. Sans conversion, le booléen finissait stocké comme
    /// la chaîne « false » et le site tentait de la charger comme une URL.
    /// </summary>
    public class AvatarUrlConverterTests
    {
        private sealed class Porteur
        {
            [JsonProperty("avatar")]
            [JsonConverter(typeof(AvatarUrlConverter))]
            public string? Avatar { get; set; }
        }

        private static string? Lire(string json)
            => JsonConvert.DeserializeObject<Porteur>(json)?.Avatar;

        [Fact]
        public void UrlReelle_EstConservee()
        {
            Lire("{\"avatar\":\"/storage/user/331/avatar/x/default-hd.gif\"}")
                .Should().Be("/storage/user/331/avatar/x/default-hd.gif");
        }

        [Fact]
        public void BooleenFalse_DevientNull()
        {
            // Le cas qui polluait la base : `getCadaversInformation` et `getAuthorInformation`
            // écrivent `false` quand il n'y a pas de média exploitable.
            Lire("{\"avatar\":false}").Should().BeNull();
        }

        [Fact]
        public void BooleenTrue_DevientNullAussi()
        {
            // `true` n'est pas plus une URL que `false`. Le conserver donnerait « True » en base.
            Lire("{\"avatar\":true}").Should().BeNull();
        }

        [Fact]
        public void Null_ResteNull()
        {
            Lire("{\"avatar\":null}").Should().BeNull();
        }

        [Fact]
        public void ChampAbsent_DonneNull()
        {
            Lire("{}").Should().BeNull();
        }

        [Theory]
        [InlineData("\"\"")]
        [InlineData("\"   \"")]
        public void ChaineVide_DevientNull(string valeur)
        {
            // Une chaîne vide serait une URL vide — donc encore une valeur, que le site essaierait
            // de charger. L'absence d'avatar doit se lire comme une absence.
            Lire("{\"avatar\":" + valeur + "}").Should().BeNull();
        }
    }
}
