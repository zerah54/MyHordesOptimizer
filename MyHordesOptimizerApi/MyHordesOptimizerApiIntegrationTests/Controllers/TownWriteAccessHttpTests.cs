using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// Écritures sur les données d'une ville (outils externes, liste de souhaits, carte, fouilles, actions du
    /// jour, détail chamanique) avec le vrai contrôle d'accès : jeton obligatoire, réservées aux citoyens de
    /// la ville (vivants ou morts), identité prise dans le jeton et jamais dans la query.
    /// </summary>
    public class TownWriteAccessHttpTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;

        private readonly MyHordesOptimizerApplicationFactory _factory;

        public TownWriteAccessHttpTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private sealed record SeededTown(int TownId, int AliveUserId, int DeadUserId, int OutsiderUserId);

        /// <summary>L'hôte de test enregistre un ITownAccessService permissif : on le remplace par le vrai.</summary>
        private static void UseRealTownAccess(IWebHostBuilder builder)
        {
            builder.ConfigureTestServices(services => services.AddScoped<ITownAccessService, TownAccessService>());
        }

        private static SeededTown SeedTown<TEntryPoint>(WebApplicationFactory<TEntryPoint> factory) where TEntryPoint : class
        {
            using var scope = factory.Services.CreateScope();
            var (townId, aliveUserId, deadUserId, outsiderUserId) = AttackTestSupport.SeedTown(scope.ServiceProvider.GetRequiredService<MhoContext>(), Day);
            return new SeededTown(townId, aliveUserId, deadUserId, outsiderUserId);
        }

        private static HttpClient CreateClient<TEntryPoint>(WebApplicationFactory<TEntryPoint> factory, int? userId) where TEntryPoint : class
        {
            var client = factory.CreateClient();
            if (userId.HasValue)
            {
                using var scope = factory.Services.CreateScope();
                var token = scope.ServiceProvider.GetRequiredService<IAuthenticationService>()
                    .CreateToken(new SimpleMeDto { Id = userId.Value, UserName = "test-user-" + userId.Value }, "irrelevant-user-key")
                    .AccessToken;
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }
            return client;
        }

        private static StringContent Json(string json)
        {
            return new StringContent(json, Encoding.UTF8, "application/json");
        }

        [Fact]
        public async Task PostBag_SansJeton_Renvoie401()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var town = SeedTown(factory);

            var response = await CreateClient(factory, userId: null).PostAsync($"/ExternalTools/Bag?townId={town.TownId}", Json($"{{\"userId\":{town.AliveUserId},\"objects\":[]}}"));

            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task PostBag_Etranger_Renvoie403()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var town = SeedTown(factory);

            var response = await CreateClient(factory, town.OutsiderUserId).PostAsync($"/ExternalTools/Bag?townId={town.TownId}", Json($"{{\"userId\":{town.AliveUserId},\"objects\":[]}}"));

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task PostBag_Citoyen_Renvoie200()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var town = SeedTown(factory);

            var response = await CreateClient(factory, town.AliveUserId).PostAsync($"/ExternalTools/Bag?townId={town.TownId}", Json($"{{\"userId\":{town.AliveUserId},\"objects\":[]}}"));

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task PutWishList_Etranger_Renvoie403()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var town = SeedTown(factory);

            var response = await CreateClient(factory, town.OutsiderUserId).PutAsync($"/WishList?townId={town.TownId}&userId={town.AliveUserId}", Json("[]"));

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task PutWishList_CitoyenMort_EnregistreSousLIdentiteDuJeton()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var town = SeedTown(factory);

            // userId de query volontairement faux : il est ignoré.
            var response = await CreateClient(factory, town.DeadUserId).PutAsync($"/WishList?townId={town.TownId}&userId={town.OutsiderUserId}", Json("[]"));

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            using var scope = factory.Services.CreateScope();
            scope.ServiceProvider.GetRequiredService<MhoContext>().Towns.AsNoTracking()
                .Single(t => t.IdTown == town.TownId).IdUserWishListUpdater.Should().Be(town.DeadUserId);
        }

        [Fact]
        public async Task PostMapCell_Etranger_Renvoie403()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var town = SeedTown(factory);

            var response = await CreateClient(factory, town.OutsiderUserId).PostAsync($"/Map/Cell?townId={town.TownId}&userId={town.AliveUserId}", Json("{\"x\":0,\"y\":0}"));

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task PostMapDigs_Etranger_Renvoie403()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var town = SeedTown(factory);

            var response = await CreateClient(factory, town.OutsiderUserId).PostAsync($"/Fetcher/MapDigs?townId={town.TownId}&userId={town.AliveUserId}",
                Json($"[{{\"x\":0,\"y\":0,\"day\":{Day},\"diggerId\":{town.AliveUserId},\"nbSucces\":1,\"nbTotalDig\":1}}]"));

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task DeleteMapDigs_Etranger_Renvoie403()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var town = SeedTown(factory);
            int cellId;
            using (var scope = factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                var cell = new MapCell { IdTown = town.TownId, X = 1, Y = 1 };
                context.MapCells.Add(cell);
                context.SaveChanges();
                cellId = cell.IdCell;
            }

            var response = await CreateClient(factory, town.OutsiderUserId).DeleteAsync($"/Fetcher/MapDigs?idCell={cellId}&diggerId={town.AliveUserId}&day={Day}");

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task PostDailyAction_Etranger_Renvoie403()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var town = SeedTown(factory);

            var response = await CreateClient(factory, town.OutsiderUserId).PostAsync($"/Town/{town.TownId}/user/{town.AliveUserId}/dailyAction/test?day={Day}", null);

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task PostChamanicDetail_Etranger_Renvoie403()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var town = SeedTown(factory);

            var response = await CreateClient(factory, town.OutsiderUserId).PostAsync($"/Town/{town.TownId}/user/{town.AliveUserId}/chamanicDetail",
                Json("{\"isImmuneToSoul\":false,\"nbPotionChaman\":0}"));

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }
    }
}
