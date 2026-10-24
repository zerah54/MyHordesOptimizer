using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>
    /// Chaussures équipées d'un citoyen, déclarées dans la liste des citoyens ou envoyées par le script :
    /// POST Town/{townId}/user/{userId}/shoesEquipped, relues avec le citoyen.
    /// </summary>
    public class CitizenShoesEquippedHttpTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;

        private readonly MyHordesOptimizerApplicationFactory _factory;

        public CitizenShoesEquippedHttpTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private (int townId, int userId) SeedTown()
        {
            using var scope = _factory.Services.CreateScope();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(scope.ServiceProvider.GetRequiredService<MhoContext>(), Day);
            return (townId, aliveUserId);
        }

        private TownCitizen StoredCitizen(int townId, int userId)
        {
            using var scope = _factory.Services.CreateScope();
            return scope.ServiceProvider.GetRequiredService<MhoContext>().TownCitizens.AsNoTracking()
                .Single(citizen => citizen.IdTown == townId && citizen.IdUser == userId);
        }

        private static StringContent Json(string json)
        {
            return new StringContent(json, Encoding.UTF8, "application/json");
        }

        [Fact]
        public async Task ShoesEquipped_EnregistreEtRelu()
        {
            var (townId, userId) = SeedTown();
            var client = AttackTestSupport.CreateClientFor(_factory, userId);
            using (var before = JsonDocument.Parse(await client.GetStringAsync($"/Town/{townId}/user/{userId}")))
            {
                before.RootElement.GetProperty("shoesEquipped").GetBoolean().Should().BeFalse();
            }

            var response = await client.PostAsync($"/Town/{townId}/user/{userId}/shoesEquipped", Json("{\"shoesEquipped\":true}"));

            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            StoredCitizen(townId, userId).ShoesEquipped.Should().Be(true);
            using var citizen = JsonDocument.Parse(await client.GetStringAsync($"/Town/{townId}/user/{userId}"));
            citizen.RootElement.GetProperty("shoesEquipped").GetBoolean().Should().BeTrue();

            (await client.PostAsync($"/Town/{townId}/user/{userId}/shoesEquipped", Json("{\"shoesEquipped\":false}"))).StatusCode.Should().Be(HttpStatusCode.NoContent);
            StoredCitizen(townId, userId).ShoesEquipped.Should().Be(false);
        }

        [Fact]
        public async Task CitoyenHorsDeLaVille_OuSansJeton_Refuse()
        {
            var (townId, userId) = SeedTown();

            var unknown = await AttackTestSupport.CreateClientFor(_factory, userId)
                .PostAsync($"/Town/{townId}/user/{userId + 1}/shoesEquipped", Json("{\"shoesEquipped\":true}"));
            unknown.IsSuccessStatusCode.Should().BeFalse();

            var anonymous = await _factory.CreateClient()
                .PostAsync($"/Town/{townId}/user/{userId}/shoesEquipped", Json("{\"shoesEquipped\":true}"));
            anonymous.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
}
