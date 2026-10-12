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
    /// Campings déjà effectués et niveaux des capacités héroïques d'un citoyen, saisis à la main :
    /// POST Town/{townId}/user/{userId}/campingCount et /heroSkills, relus avec le citoyen.
    /// </summary>
    public class CitizenCampingSkillsHttpTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;

        private readonly MyHordesOptimizerApplicationFactory _factory;

        public CitizenCampingSkillsHttpTests(MyHordesOptimizerApplicationFactory factory)
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
        public async Task CampingCount_EnregistreEtRelu()
        {
            var (townId, userId) = SeedTown();
            var client = AttackTestSupport.CreateClientFor(_factory, userId);
            using (var before = JsonDocument.Parse(await client.GetStringAsync($"/Town/{townId}/user/{userId}")))
            {
                before.RootElement.GetProperty("campingCount").GetInt32().Should().Be(0);
            }

            var response = await client.PostAsync($"/Town/{townId}/user/{userId}/campingCount", Json("{\"campingCount\":3}"));

            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            StoredCitizen(townId, userId).CampingCount.Should().Be(3);
            using var citizen = JsonDocument.Parse(await client.GetStringAsync($"/Town/{townId}/user/{userId}"));
            citizen.RootElement.GetProperty("campingCount").GetInt32().Should().Be(3);

            (await client.PostAsync($"/Town/{townId}/user/{userId}/campingCount", Json("{\"campingCount\":0}"))).StatusCode.Should().Be(HttpStatusCode.NoContent);
            StoredCitizen(townId, userId).CampingCount.Should().Be(0);
        }

        [Fact]
        public async Task HeroSkills_EnregistresEtRelus()
        {
            var (townId, userId) = SeedTown();
            var client = AttackTestSupport.CreateClientFor(_factory, userId);

            var response = await client.PostAsync($"/Town/{townId}/user/{userId}/heroSkills", Json("{\"s\":1,\"u\":null,\"p\":0,\"e\":4,\"r\":2}"));

            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            var stored = StoredCitizen(townId, userId);
            stored.HeroSkillLevelS.Should().Be(1);
            stored.HeroSkillLevelU.Should().BeNull();
            stored.HeroSkillLevelP.Should().Be(0);
            stored.HeroSkillLevelE.Should().Be(4);
            stored.HeroSkillLevelR.Should().Be(2);
            using var citizen = JsonDocument.Parse(await client.GetStringAsync($"/Town/{townId}/user/{userId}"));
            var skills = citizen.RootElement.GetProperty("heroSkills");
            skills.GetProperty("r").GetInt32().Should().Be(2);
            skills.GetProperty("u").ValueKind.Should().Be(JsonValueKind.Null);
        }

        [Fact]
        public async Task ValeursHorsLimites_Refusees()
        {
            var (townId, userId) = SeedTown();
            var client = AttackTestSupport.CreateClientFor(_factory, userId);

            (await client.PostAsync($"/Town/{townId}/user/{userId}/heroSkills", Json("{\"r\":5}"))).StatusCode.Should().Be(HttpStatusCode.BadRequest);
            (await client.PostAsync($"/Town/{townId}/user/{userId}/campingCount", Json("{\"campingCount\":-1}"))).StatusCode.Should().Be(HttpStatusCode.BadRequest);
            (await client.PostAsync($"/Town/{townId}/user/{userId}/campingCount", Json("{\"campingCount\":101}"))).StatusCode.Should().Be(HttpStatusCode.BadRequest);
            (await client.PostAsync($"/Town/{townId}/user/{userId}/campingCount", Json("{\"campingCount\":null}"))).StatusCode.Should().Be(HttpStatusCode.BadRequest);

            var stored = StoredCitizen(townId, userId);
            stored.HeroSkillLevelR.Should().BeNull();
            stored.CampingCount.Should().BeNull();
        }

        [Fact]
        public async Task CitoyenHorsDeLaVille_OuSansJeton_Refuse()
        {
            var (townId, userId) = SeedTown();

            var unknown = await AttackTestSupport.CreateClientFor(_factory, userId)
                .PostAsync($"/Town/{townId}/user/{userId + 1}/campingCount", Json("{\"campingCount\":1}"));
            unknown.IsSuccessStatusCode.Should().BeFalse();

            var anonymous = await _factory.CreateClient()
                .PostAsync($"/Town/{townId}/user/{userId}/campingCount", Json("{\"campingCount\":1}"));
            anonymous.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
}
