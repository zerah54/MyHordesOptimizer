using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.ZenHordes;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Repository.Impl.ExternalTools;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Repository
{
    /// <summary>Aucun appel réseau réel : ZenHordes limite à 100 requêtes par quart d'heure, les tests ne doivent jamais l'entamer.</summary>
    public class ZenHordesRepositoryTests
    {
        private sealed class StubHandler : HttpMessageHandler
        {
            public HttpRequestMessage? Request { get; private set; }
            public string? Body { get; private set; }
            public HttpStatusCode Status { get; set; } = HttpStatusCode.OK;
            public string ResponseBody { get; set; } = "{\"success\":true}";

            protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                Request = request;
                Body = request.Content == null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
                return new HttpResponseMessage(Status) { Content = new StringContent(ResponseBody) };
            }
        }

        private sealed class StubHttpClientFactory : IHttpClientFactory
        {
            private readonly HttpMessageHandler _handler;
            public StubHttpClientFactory(HttpMessageHandler handler) { _handler = handler; }
            public HttpClient CreateClient(string name) => new(_handler, disposeHandler: false);
        }

        private sealed class StubConfiguration : IZenHordesConfiguration
        {
            public string Url => "https://zen.test";
        }

        private static ZenHordesRepository NewRepository(StubHandler handler)
        {
            return new ZenHordesRepository(NullLogger<ZenHordesRepository>.Instance, new StubHttpClientFactory(handler), new StubConfiguration());
        }

        private static ZenHordesUpdateRequestDto Request()
        {
            return new ZenHordesUpdateRequestDto { Key = "cle", TownId = 4242, UserId = 9, X = 1, Y = 2 };
        }

        [Fact]
        public async Task UpdateAsync_PosteSurSlashUpdate_AvecLaCleDuJoueurEtSansNull()
        {
            var handler = new StubHandler();

            await NewRepository(handler).UpdateAsync(Request());

            handler.Request!.Method.Should().Be(HttpMethod.Post);
            handler.Request!.RequestUri!.ToString().Should().Be("https://zen.test/update");
            handler.Body.Should().Be("{\"key\":\"cle\",\"townId\":4242,\"userId\":9,\"x\":1,\"y\":2}");
        }

        [Fact]
        public async Task UpdateAsync_Reponse200SuccessFalse_EstUnEchec()
        {
            var handler = new StubHandler { ResponseBody = "{\"success\":false,\"error\":\"cle refusee\"}" };

            Func<Task> act = () => NewRepository(handler).UpdateAsync(Request());

            (await act.Should().ThrowAsync<MhoTechnicalException>()).WithMessage("*cle refusee*");
        }

        [Fact]
        public async Task UpdateAsync_Reponse429_LeveUneWebApiExceptionPorteuseDuCorps()
        {
            var handler = new StubHandler { Status = HttpStatusCode.TooManyRequests, ResponseBody = "{\"success\":false,\"error\":\"Too many requests\"}" };

            Func<Task> act = () => NewRepository(handler).UpdateAsync(Request());

            var exception = (await act.Should().ThrowAsync<WebApiException>()).Which;
            exception.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
            exception.Response.Should().Contain("Too many requests");
        }
    }
}
