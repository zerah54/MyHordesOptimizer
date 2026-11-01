using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Fakes;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// Zen Hordes de bout en bout (contrôleur, job en arrière-plan, dépôt) pour un joueur qui n'a coché que lui :
    /// ZenHordes refuse une clé absente, et la clé ne doit pas se perdre en passant par le job.
    /// </summary>
    public class ExternalToolsZenHordesHttpTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsZenHordesHttpTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private static StringContent Body(string? isZenHordes)
        {
            var zenFlag = isZenHordes == null ? string.Empty : ",\"isZenHordes\":\"" + isZenHordes + "\"";
            var json = "{\"townDetails\":{\"townId\":1,\"townX\":100,\"townY\":100,\"isChaos\":false},\"map\":{\"zenHordesCell\":{\"x\":1,\"y\":2,\"zombies\":3},"
                + "\"toolsToUpdate\":{\"isMyHordesOptimizer\":\"none\",\"isGestHordes\":\"none\",\"isFataMorgana\":\"none\",\"isBigBrothHordes\":\"none\"" + zenFlag + "}}}";
            return new StringContent(json, Encoding.UTF8, "application/json");
        }

        private WebApplicationFactory<Program> FactoryWith(FakeZenHordesRepository zen)
        {
            return _factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services => services.AddScoped<IZenHordesRepository>(_ => zen)));
        }

        private static HttpClient AuthenticatedClient(WebApplicationFactory<Program> factory, int userId, string userKey)
        {
            var client = factory.CreateClient();
            using var scope = factory.Services.CreateScope();
            var token = scope.ServiceProvider.GetRequiredService<IAuthenticationService>()
                .CreateToken(new SimpleMeDto { Id = userId, UserName = "test-user-" + userId }, userKey)
                .AccessToken;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return client;
        }

        /// <summary>Attend la fin du job puis rend le statut de l'outil Zen Hordes, ou null s'il n'a pas été sollicité.</summary>
        private static async Task<string?> ZenToolStatus(HttpClient client, string userKey, int userId, JsonElement started)
        {
            var jobId = started.GetProperty("jobId").GetString();
            for (var attempt = 0; attempt < 50; attempt++)
            {
                var response = await client.GetAsync($"/ExternalTools/Update/Status?userKey={userKey}&userId={userId}&jobId={jobId}");
                var state = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
                if (!state.GetProperty("isRunning").GetBoolean())
                {
                    return state.GetProperty("tools").EnumerateArray()
                        .Where(tool => tool.GetProperty("tool").GetString() == "zenHordes")
                        .Select(tool => tool.GetProperty("status").GetString())
                        .SingleOrDefault();
                }
                await Task.Delay(100);
            }
            throw new TimeoutException("Le job n'a pas terminé.");
        }

        [Fact]
        public async Task SeulementZenCoche_LaCleEtLeJoueurDeLaRequeteArriventAZenHordes_EtLOutilPasseAuVert()
        {
            var userKey = "zen-key-" + Guid.NewGuid().ToString("N").Substring(0, 8);
            var userId = new Random().Next(1, int.MaxValue);
            var zen = new FakeZenHordesRepository();
            using var factory = FactoryWith(zen);
            var client = AuthenticatedClient(factory, userId, userKey);

            var start = await client.PostAsync($"/ExternalTools/Update/Start?userKey={userKey}&userId={userId}", Body("cell"));

            start.StatusCode.Should().Be(HttpStatusCode.Accepted);
            var status = await ZenToolStatus(client, userKey, userId, JsonDocument.Parse(await start.Content.ReadAsStringAsync()).RootElement);
            status.Should().Be("success");
            var sent = zen.Calls.Should().ContainSingle().Which;
            sent.Key.Should().Be(userKey);
            sent.UserId.Should().Be(userId);
            sent.TownId.Should().Be(1);
            sent.X.Should().Be(1);
            sent.Y.Should().Be(2);
            sent.Zombies.Should().Be(3);
        }

        /// <summary>Les addons déjà déployés ne connaissent pas isZenHordes : leur requête ne doit être ni refusée ni rien envoyer à ZenHordes.</summary>
        [Fact]
        public async Task AddonAnterieur_SansIsZenHordes_EstAccepteEtNAppellePasZenHordes()
        {
            var userKey = "old-addon-key-" + Guid.NewGuid().ToString("N").Substring(0, 8);
            var userId = new Random().Next(1, int.MaxValue);
            var zen = new FakeZenHordesRepository();
            using var factory = FactoryWith(zen);
            var client = AuthenticatedClient(factory, userId, userKey);

            var start = await client.PostAsync($"/ExternalTools/Update/Start?userKey={userKey}&userId={userId}", Body(null));

            start.StatusCode.Should().Be(HttpStatusCode.Accepted);
            var status = await ZenToolStatus(client, userKey, userId, JsonDocument.Parse(await start.Content.ReadAsStringAsync()).RootElement);
            status.Should().BeNull();
            zen.Calls.Should().BeEmpty();
        }
    }
}
