using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApiUnitTests.DiscordBot;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Securite
{
    /// <summary>Les appels sortants (MyHordes, GH, Fata, Zen) journalisent URL et corps sans les clés qu'ils transportent.</summary>
    public class OutboundCallLogRedactionTests
    {
        private sealed class OkHandler : HttpMessageHandler
        {
            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
                => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{}") });
        }

        private sealed class StubHttpClientFactory : IHttpClientFactory
        {
            public HttpClient CreateClient(string name) => new(new OkHandler(), disposeHandler: true);
        }

        private sealed class TestRepository : AbstractWebApiRepositoryBase
        {
            public TestRepository(ILogger<AbstractWebApiRepositoryBase> logger) : base(logger, new StubHttpClientFactory()) { }
            public override string HttpClientName => string.Empty;
        }

        [Fact]
        public void Get_ne_journalise_pas_les_cles_de_l_url()
        {
            var logger = new CapturingLogger<AbstractWebApiRepositoryBase>();

            new TestRepository(logger).Get("https://myhord.es/api/x/json/me?appkey=APPSECRET&userkey=USERSECRET");

            var messages = string.Join("\n", logger.Entries.Select(entry => entry.Message));
            messages.Should().Contain("myhord.es/api/x/json/me");
            messages.Should().NotContain("APPSECRET").And.NotContain("USERSECRET");
        }

        [Fact]
        public void Post_ne_journalise_pas_les_cles_du_corps_json()
        {
            var logger = new CapturingLogger<AbstractWebApiRepositoryBase>();

            new TestRepository(logger).Post("https://fatamorgana.test/mho", new { accessKey = "FATASECRET", userKey = "USERSECRET", x = 3 });

            var messages = string.Join("\n", logger.Entries.Select(entry => entry.Message));
            messages.Should().Contain("HttpBody=");
            messages.Should().NotContain("FATASECRET").And.NotContain("USERSECRET");
        }
    }
}
