using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Newtonsoft.Json.Linq;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// Suite à une intégration tierce (script de Zen) : /Authentication/Token n'existait qu'en GET,
    /// avec userKey en clair dans la query string (logs d'accès, historique, Referer). Ajout d'une
    /// route POST équivalente (body JSON) ; le GET reste disponible pour compat avec les scripts déjà
    /// en place. Ajout aussi d'un rate-limit par userKey : /Token était martelable sans aucun frein,
    /// ce qui tape directement dans le quota MyHordes de l'appli (GetSimpleMeAsync à chaque appel).
    /// </summary>
    public class AuthenticationControllerTokenTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public AuthenticationControllerTokenTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        /// <summary>GetMe() minimal, hors ville (Map null) : suffit à faire réussir GetSimpleMeAsync sans exercer la synchro de ville.</summary>
        private sealed class GhostUserMyHordesApiRepository : IMyHordesApiRepository
        {
            private readonly int _userId;
            private readonly string _userName;

            public GhostUserMyHordesApiRepository(int userId, string userName)
            {
                _userId = userId;
                _userName = userName;
            }

            public MyHordesUserDetailsDto GetMe() => new() { Id = _userId, Name = _userName, Map = null };

            public Dictionary<string, MyHordesItem> GetItems() => new();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMeIdentity() => new() { Id = _userId };
            public MyHordesUserDetailsDto GetUserPictos(int userId) => throw new NotSupportedException();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => new();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => new();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => new();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => Task.FromResult(new Dictionary<string, MyHordesApiBuildingDto>());
            public List<int> GetTownList(int? season = null) => new();
            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new();
            public MyHordesMap GetMapDetails(int mapId) => null;
        }

        private HttpClient CreateClientWithGhostUser(int userId, string userName)
        {
            var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => new GhostUserMyHordesApiRepository(userId, userName));
                });
            });
            return factory.CreateClient();
        }

        private static StringContent TokenRequestBody(string userKey) =>
            new($"{{\"userKey\":\"{userKey}\"}}", Encoding.UTF8, "application/json");

        [Fact]
        public async Task PostToken_MemeComportementQueGetToken()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userKey = "post-key-" + suffix;
            var userId = new Random().Next(1, int.MaxValue);
            var client = CreateClientWithGhostUser(userId, "test-user-" + suffix);

            var response = await client.PostAsync("/Authentication/Token", TokenRequestBody(userKey));

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var body = JObject.Parse(await response.Content.ReadAsStringAsync());
            body["simpleMe"]!["id"]!.Value<int>().Should().Be(userId);
            body["token"]!["accessToken"]!.Value<string>().Should().NotBeNullOrEmpty();
        }

        [Fact(Skip = "Rate limiter désactivé côté contrôleur (incident prod 2026-09-09, cf. AuthenticationController.GetToken) : partitionné par userKey, il bloquait tout appel légitime répété de l'addon (un appel /Token par chargement de page, non throttlé côté client). À réactiver une fois repartitionné (IP, ou échecs seulement).")]
        public async Task GetToken_DepasseLaLimiteParUserKey_Renvoie429()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userKey = "rate-limit-key-" + suffix;
            var userId = new Random().Next(1, int.MaxValue);
            var client = CreateClientWithGhostUser(userId, "test-user-" + suffix);

            // TokenApiLimit:PermitLimit = 2 dans appsettings.json de ce projet de test.
            var first = await client.GetAsync($"/Authentication/Token?userKey={userKey}");
            var second = await client.GetAsync($"/Authentication/Token?userKey={userKey}");
            var third = await client.GetAsync($"/Authentication/Token?userKey={userKey}");

            first.StatusCode.Should().Be(HttpStatusCode.OK);
            second.StatusCode.Should().Be(HttpStatusCode.OK);
            third.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        }

        [Fact(Skip = "Rate limiter désactivé côté contrôleur (incident prod 2026-09-09) : voir GetToken_DepasseLaLimiteParUserKey_Renvoie429.")]
        public async Task RateLimit_PartageEntreGetEtPost_PourLeMemeUserKey()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userKey = "shared-key-" + suffix;
            var userId = new Random().Next(1, int.MaxValue);
            var client = CreateClientWithGhostUser(userId, "test-user-" + suffix);

            var getResponse = await client.GetAsync($"/Authentication/Token?userKey={userKey}");
            var postResponse = await client.PostAsync("/Authentication/Token", TokenRequestBody(userKey));
            var thirdResponse = await client.GetAsync($"/Authentication/Token?userKey={userKey}");

            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            postResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            thirdResponse.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        }

        [Fact(Skip = "Rate limiter désactivé côté contrôleur (incident prod 2026-09-09) : voir GetToken_DepasseLaLimiteParUserKey_Renvoie429.")]
        public async Task RateLimit_UserKeyDifferents_ChacunAvecSaPropreLimite()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userKeyA = "key-a-" + suffix;
            var userKeyB = "key-b-" + suffix;
            var userId = new Random().Next(1, int.MaxValue);
            var client = CreateClientWithGhostUser(userId, "test-user-" + suffix);

            await client.GetAsync($"/Authentication/Token?userKey={userKeyA}");
            await client.GetAsync($"/Authentication/Token?userKey={userKeyA}");
            var thirdOnA = await client.GetAsync($"/Authentication/Token?userKey={userKeyA}");
            var firstOnB = await client.GetAsync($"/Authentication/Token?userKey={userKeyB}");

            thirdOnA.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
            firstOnB.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
