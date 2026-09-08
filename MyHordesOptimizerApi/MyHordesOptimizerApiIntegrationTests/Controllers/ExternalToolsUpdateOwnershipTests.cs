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
using MyHordesOptimizerApiIntegrationTests.Fakes;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// /ExternalTools/Update n'exige plus de JWT (scripts tiers) : la vérification d'identité passe
    /// par VerifyUserKeyOwnership (TOFU sur le cache hash(userKey) -> userId, amorcé par un seul
    /// appel GetMeIdentity() pour une clé jamais vue). Voir docs/superpowers/specs/2026-09-08-
    /// externaltools-update-userkey-ownership-design.md.
    /// </summary>
    public class ExternalToolsUpdateOwnershipTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsUpdateOwnershipTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        /// <summary>Renvoie un id fixe sur GetMeIdentity() et compte ses appels.</summary>
        private sealed class CountingIdentityMyHordesApiRepository : IMyHordesApiRepository
        {
            private readonly int _realUserId;
            public int GetMeIdentityCallCount { get; private set; }

            public CountingIdentityMyHordesApiRepository(int realUserId)
            {
                _realUserId = realUserId;
            }

            public MyHordesUserDetailsDto GetMeIdentity()
            {
                GetMeIdentityCallCount++;
                return new MyHordesUserDetailsDto { Id = _realUserId };
            }

            public MyHordesUserDetailsDto GetMe() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotSupportedException();
            public Dictionary<string, MyHordesItem> GetItems() => new();
            public MyHordesUserDetailsDto GetUserPictos(int userId) => throw new NotSupportedException();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => new();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => new();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => new();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => Task.FromResult(new Dictionary<string, MyHordesApiBuildingDto>());
            public List<int> GetTownList(int? season = null) => new();
            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new();
            public MyHordesMap GetMapDetails(int mapId) => null;
        }

        /// <summary>
        /// Corps minimal qui passe ValidateUpdateRequest (TownDetails.TownId != 0, Map non null)
        /// sans déclencher aucune unité de synchro (tous les ToolsToUpdate sont "none", donc
        /// falsy) : NeedsTownId reste false, aucun accès BDD ni appel MyHordes supplémentaire.
        /// </summary>
        private static StringContent MinimalUpdateBody() =>
            new StringContent("{\"townDetails\":{\"townId\":1,\"townX\":100,\"townY\":100,\"isChaos\":false},\"map\":{\"toolsToUpdate\":{\"isMyHordesOptimizer\":\"none\",\"isGestHordes\":\"none\",\"isFataMorgana\":\"none\",\"isBigBrothHordes\":\"none\"}}}", Encoding.UTF8, "application/json");

        private HttpClient CreateClientWithRepository(IMyHordesApiRepository repository)
        {
            var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => repository);
                });
            });
            return factory.CreateClient();
        }

        [Fact]
        public async Task CleInconnue_BonUserId_Renvoie200EtAmorceLeCacheUneSeuleFois()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userKey = "fresh-key-" + suffix;
            var userId = new Random().Next(1, int.MaxValue);
            var fake = new CountingIdentityMyHordesApiRepository(userId);
            var client = CreateClientWithRepository(fake);

            var first = await client.PostAsync($"/ExternalTools/Update?userKey={userKey}&userId={userId}", MinimalUpdateBody());
            var second = await client.PostAsync($"/ExternalTools/Update?userKey={userKey}&userId={userId}", MinimalUpdateBody());

            first.StatusCode.Should().Be(HttpStatusCode.OK);
            second.StatusCode.Should().Be(HttpStatusCode.OK);
            fake.GetMeIdentityCallCount.Should().Be(1);
        }

        [Fact]
        public async Task CleInconnue_UserIdUsurpe_Renvoie403()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userKey = "victim-key-" + suffix;
            var realOwnerId = new Random().Next(1, int.MaxValue);
            var attackerClaimedId = new Random().Next(1, int.MaxValue);
            var client = CreateClientWithRepository(new CountingIdentityMyHordesApiRepository(realOwnerId));

            var response = await client.PostAsync($"/ExternalTools/Update?userKey={userKey}&userId={attackerClaimedId}", MinimalUpdateBody());

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task CleDejaConnue_BonUserId_ZeroAppelMyHordes()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userKey = "cached-key-" + suffix;
            var userId = new Random().Next(1, int.MaxValue);

            // 1er appel : amorce le cache STATIQUE (partagé au niveau process, pas par hôte de test).
            using (var warmupFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => new CountingIdentityMyHordesApiRepository(userId));
                });
            }))
            {
                var warmup = await warmupFactory.CreateClient().PostAsync($"/ExternalTools/Update?userKey={userKey}&userId={userId}", MinimalUpdateBody());
                warmup.StatusCode.Should().Be(HttpStatusCode.OK);
            }

            // 2e appel, sur un hôte DIFFÉRENT dont le repository lève si GetMeIdentity est appelé :
            // seul le cache statique peut faire passer cet appel.
            using var secondFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => new ThrowingMyHordesApiRepository(HttpStatusCode.ServiceUnavailable, "ne doit jamais être appelé"));
                });
            });

            var response = await secondFactory.CreateClient().PostAsync($"/ExternalTools/Update?userKey={userKey}&userId={userId}", MinimalUpdateBody());

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task CleInconnue_MyHordesIndisponible_Renvoie503()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var userKey = "unreachable-key-" + suffix;
            var userId = new Random().Next(1, int.MaxValue);
            var client = CreateClientWithRepository(new ThrowingMyHordesApiRepository(HttpStatusCode.ServiceUnavailable, "Quota dépassé"));

            var response = await client.PostAsync($"/ExternalTools/Update?userKey={userKey}&userId={userId}", MinimalUpdateBody());

            response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        }
    }
}
