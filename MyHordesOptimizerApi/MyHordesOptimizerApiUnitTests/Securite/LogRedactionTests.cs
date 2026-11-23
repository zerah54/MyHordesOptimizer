using FluentAssertions;
using Microsoft.AspNetCore.HttpLogging;
using MyHordesOptimizerApi.Serilog;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Securite
{
    /// <summary>Clés joueur, clés d'application et jetons ne doivent jamais atteindre un log en clair.</summary>
    public class LogRedactionTests
    {
        [Fact]
        public void HttpLoggingFields_NeJournaliseNiQueryNiCorps()
        {
            var fields = LogRedaction.HttpLoggingFields;

            fields.HasFlag(HttpLoggingFields.RequestQuery).Should().BeFalse();
            fields.HasFlag(HttpLoggingFields.RequestBody).Should().BeFalse();
            fields.HasFlag(HttpLoggingFields.ResponseBody).Should().BeFalse();
            fields.HasFlag(HttpLoggingFields.RequestPath).Should().BeTrue();
            fields.HasFlag(HttpLoggingFields.ResponseStatusCode).Should().BeTrue();
            fields.HasFlag(HttpLoggingFields.Duration).Should().BeTrue();
        }

        [Fact]
        public void Masque_les_cles_d_une_url_sortante_et_garde_les_autres_parametres()
        {
            var redacted = LogRedaction.Redact("https://myhord.es/api/x/json/me?appkey=APPSECRET&userkey=USERSECRET&fields=id,name");

            redacted.Should().Be("https://myhord.es/api/x/json/me?appkey=***&userkey=***&fields=id,name");
        }

        [Fact]
        public void Masque_la_cle_joueur_d_une_query_entrante_quelle_que_soit_la_casse()
        {
            LogRedaction.Redact("?userKey=ef469c130f27&userId=21786").Should().Be("?userKey=***&userId=21786");
        }

        [Fact]
        public void Masque_un_parametre_key_isole_sans_toucher_un_nom_qui_finit_par_key()
        {
            LogRedaction.Redact("?key=BBHSECRET&sid=3&monkey=banane").Should().Be("?key=***&sid=3&monkey=banane");
        }

        [Fact]
        public void Masque_les_cles_d_un_corps_json_et_garde_les_autres_champs()
        {
            var redacted = LogRedaction.Redact("{\"accessKey\":\"FATASECRET\",\"userKey\" : \"USERSECRET\",\"key\":\"ZENSECRET\",\"idMh\":21786}");

            redacted.Should().Be("{\"accessKey\":\"***\",\"userKey\" : \"***\",\"key\":\"***\",\"idMh\":21786}");
        }

        [Fact]
        public void Masque_un_jeton_jwt()
        {
            LogRedaction.Redact("Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc-DEF_123 fin").Should().Be("Bearer *** fin");
        }

        [Fact]
        public void Laisse_intact_un_texte_sans_secret()
        {
            LogRedaction.Redact("GET call initiated [HttpRequestUrl=https://gesthordes.fr/majScript]")
                .Should().Be("GET call initiated [HttpRequestUrl=https://gesthordes.fr/majScript]");
        }

        [Fact]
        public void Laisse_passer_null()
        {
            LogRedaction.Redact(null).Should().BeNull();
        }
    }
}
