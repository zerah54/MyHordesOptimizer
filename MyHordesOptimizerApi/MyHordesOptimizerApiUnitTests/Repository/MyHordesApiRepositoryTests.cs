using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Repository
{
    /// <summary>En maintenance, MyHordes renvoie une page HTML sur les routes /json/* : l'appelant doit recevoir une erreur lisible, pas un JsonReaderException brut.</summary>
    public class MyHordesApiRepositoryTests
    {
        private sealed class StubHandler : HttpMessageHandler
        {
            public string ResponseBody { get; set; } = "{}";

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(ResponseBody) });
            }
        }

        private sealed class StubHttpClientFactory : IHttpClientFactory
        {
            private readonly HttpMessageHandler _handler;
            public StubHttpClientFactory(HttpMessageHandler handler) { _handler = handler; }
            public HttpClient CreateClient(string name) => new(_handler, disposeHandler: false);
        }

        private sealed class StubConfiguration : IMyHordesApiConfiguration
        {
            public string Url => "https://mh.test";
            public string AppKey => "appkey";
        }

        private sealed class StubUserInfoProvider : IUserInfoProvider
        {
            public string? UserKey { get; set; } = "userkey";
            public int UserId { get; set; }
            public string? UserName { get; set; }
            public SimpleMeTownDetailDto? TownDetail { get; set; }
            public LastUpdateInfoDto GenerateLastUpdateInfo() => new();
        }

        private static MyHordesApiRepository NewRepository(StubHandler handler)
        {
            return new MyHordesApiRepository(NullLogger<MyHordesApiRepository>.Instance, new StubHttpClientFactory(handler), new StubConfiguration(), new StubUserInfoProvider());
        }

        [Fact]
        public void GetMeIdentity_ReponseHtmlDeMaintenance_LeveUneMyHordesApiExceptionServiceUnavailable()
        {
            var handler = new StubHandler { ResponseBody = "<!DOCTYPE html><html><body>Maintenance Mode</body></html>" };

            var act = () => NewRepository(handler).GetMeIdentity();

            act.Should().Throw<MyHordesApiException>().Which.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        }
    }
}
