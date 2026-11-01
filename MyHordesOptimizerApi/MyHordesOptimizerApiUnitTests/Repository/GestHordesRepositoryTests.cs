using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Impl.ExternalTools;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Repository
{
    /// <summary>Aucun appel réseau réel vers Gest'Hordes.</summary>
    public class GestHordesRepositoryTests
    {
        private sealed class StubHandler : HttpMessageHandler
        {
            public HttpRequestMessage? Request { get; private set; }
            public string? Body { get; private set; }

            protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                Request = request;
                Body = request.Content == null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
                return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"retour\":1,\"lib\":\"Mise à jour OK.\"}") };
            }
        }

        private sealed class StubHttpClientFactory : IHttpClientFactory
        {
            private readonly HttpMessageHandler _handler;
            public StubHttpClientFactory(HttpMessageHandler handler) { _handler = handler; }
            public HttpClient CreateClient(string name) => new(_handler, disposeHandler: false);
        }

        private sealed class StubConfiguration : IGestHordesConfiguration
        {
            public string Url => "https://gh.test";
            public string LoginPath => "login";
            public string MajPath => "majScript";
            public string MajCasePath => "api/majCase";
            public string MajZombieTuePath => "api/majZombieTue";
            public string MajCitizenPath => "api/citoyens/maj";
        }

        private sealed class StubUserInfoProvider : IUserInfoProvider
        {
            public string? UserKey { get; set; } = "cle";
            public int UserId { get; set; } = 9;
            public string? UserName { get; set; }
            public SimpleMeTownDetailDto? TownDetail { get; set; }
            public LastUpdateInfoDto GenerateLastUpdateInfo() => null!;
        }

        private static GestHordesRepository NewRepository(StubHandler handler)
        {
            return new GestHordesRepository(NullLogger<GestHordesRepository>.Instance, new StubHttpClientFactory(handler), new StubUserInfoProvider(), new StubConfiguration());
        }

        [Fact]
        public void Update_SansCase_PosteLaCleEnFormulaire()
        {
            var handler = new StubHandler();

            NewRepository(handler).Update(null);

            handler.Request!.RequestUri!.ToString().Should().Be("https://gh.test/majScript");
            handler.Request!.Content!.Headers.ContentType!.MediaType.Should().Be("application/x-www-form-urlencoded");
            handler.Body.Should().Be("key=cle");
        }

        [Fact]
        public void Update_AvecCase_PosteLaCaseEnJsonAvecLaCleDuJoueur()
        {
            var handler = new StubHandler();

            NewRepository(handler).Update(new GestHordesMajScriptRequest { X = 12, Y = 11, FouilleLvl = 3 });

            handler.Request!.RequestUri!.ToString().Should().Be("https://gh.test/majScript");
            handler.Request!.Content!.Headers.ContentType!.MediaType.Should().Be("application/json");
            handler.Body.Should().Be("{\"key\":\"cle\",\"x\":12,\"y\":11,\"fouille_lvl\":3}");
        }
    }
}
