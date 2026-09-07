using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// Mécanisme ETag générique (famille 1, voir .superpowers/sdd/2026-09-03-session-lifecycle), vérifié
    /// bout en bout sur Fetcher/Bank : vraie requête HTTP, vraie BDD pour la version (ETagVersionService
    /// n'a pas de dépendance sur IMyHordesFetcherService), et IMyHordesFetcherService remplacé par un
    /// mock Moq pour prouver littéralement qu'un 304 n'appelle jamais le service métier.
    /// </summary>
    public class ETagCacheHttpTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ETagCacheHttpTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private string CreateBearerFor(int userId)
        {
            using var scope = _factory.Services.CreateScope();
            var authenticationService = scope.ServiceProvider.GetRequiredService<IAuthenticationService>();
            var me = new SimpleMeDto { Id = userId, UserName = "test-user-" + userId };
            return authenticationService.CreateToken(me, "irrelevant-user-key").AccessToken;
        }

        /// <summary>Ville + banque minimales pour que ETagVersionService calcule une version non nulle.</summary>
        private int SeedTownWithBank()
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var mapId = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = mapId, Name = "test-town-" + suffix, MapId = mapId });
            var item = new Item { IdItem = random.Next(1, int.MaxValue), Uid = "item-" + suffix };
            context.Items.Add(item);
            var lastUpdate = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdate);
            context.SaveChanges();
            context.TownBankItems.Add(new TownBankItem { IdTown = mapId, IdItem = item.IdItem, IdLastUpdateInfo = lastUpdate.IdLastUpdateInfo, IsBroken = false, Count = 1 });
            context.SaveChanges();
            return mapId;
        }

        private HttpClient CreateClientWithMockedFetcher(Mock<IMyHordesFetcherService> mock, int bearerUserId)
        {
            var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesFetcherService>(_ => mock.Object);
                });
            });
            var client = factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateBearerFor(bearerUserId));
            return client;
        }

        [Fact]
        public async Task IfNoneMatchCorrespondant_Renvoie304EtNAppelleJamaisLeServiceMetier()
        {
            var mapId = SeedTownWithBank();
            var mock = new Mock<IMyHordesFetcherService>();
            mock.Setup(s => s.GetBank(It.IsAny<int>())).Returns(new BankLastUpdateDto());
            var client = CreateClientWithMockedFetcher(mock, bearerUserId: 900001);

            var first = await client.GetAsync($"/Fetcher/Bank?townId={mapId}");
            first.StatusCode.Should().Be(HttpStatusCode.OK);
            var etag = first.Headers.ETag?.Tag;
            etag.Should().NotBeNullOrEmpty();
            first.Headers.CacheControl!.Private.Should().BeTrue();
            first.Headers.CacheControl.MustRevalidate.Should().BeTrue();
            first.Headers.Vary.Should().Contain("Authorization");
            mock.Verify(s => s.GetBank(It.IsAny<int>()), Times.Once);

            var revalidation = new HttpRequestMessage(HttpMethod.Get, $"/Fetcher/Bank?townId={mapId}");
            revalidation.Headers.TryAddWithoutValidation("If-None-Match", etag);
            var second = await client.SendAsync(revalidation);

            second.StatusCode.Should().Be(HttpStatusCode.NotModified);
            // Toujours Times.Once, pas Times.Exactly(2) : le 304 n'a pas rappelé GetBank.
            mock.Verify(s => s.GetBank(It.IsAny<int>()), Times.Once);
        }

        [Fact]
        public async Task IfNoneMatchPerime_ExecuteLeServiceMetierANouveau()
        {
            var mapId = SeedTownWithBank();
            var mock = new Mock<IMyHordesFetcherService>();
            mock.Setup(s => s.GetBank(It.IsAny<int>())).Returns(new BankLastUpdateDto());
            var client = CreateClientWithMockedFetcher(mock, bearerUserId: 900002);

            await client.GetAsync($"/Fetcher/Bank?townId={mapId}");

            var staleRequest = new HttpRequestMessage(HttpMethod.Get, $"/Fetcher/Bank?townId={mapId}");
            staleRequest.Headers.TryAddWithoutValidation("If-None-Match", "\"stale-value-from-another-version\"");
            var response = await client.SendAsync(staleRequest);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            mock.Verify(s => s.GetBank(It.IsAny<int>()), Times.Exactly(2));
        }

        [Fact]
        public async Task DeuxUtilisateursDifferents_MemeVille_NePartagentJamaisLEtag()
        {
            var mapId = SeedTownWithBank();
            var mockA = new Mock<IMyHordesFetcherService>();
            mockA.Setup(s => s.GetBank(It.IsAny<int>())).Returns(new BankLastUpdateDto());
            var clientA = CreateClientWithMockedFetcher(mockA, bearerUserId: 900003);
            var mockB = new Mock<IMyHordesFetcherService>();
            mockB.Setup(s => s.GetBank(It.IsAny<int>())).Returns(new BankLastUpdateDto());
            var clientB = CreateClientWithMockedFetcher(mockB, bearerUserId: 900004);

            var responseA = await clientA.GetAsync($"/Fetcher/Bank?townId={mapId}");
            var responseB = await clientB.GetAsync($"/Fetcher/Bank?townId={mapId}");

            var etagA = responseA.Headers.ETag?.Tag;
            var etagB = responseB.Headers.ETag?.Tag;
            etagA.Should().NotBeNullOrEmpty();
            etagB.Should().NotBeNullOrEmpty();
            etagA.Should().NotBe(etagB);
            responseA.Headers.Vary.Should().Contain("Authorization");
            responseB.Headers.Vary.Should().Contain("Authorization");
        }
    }
}
