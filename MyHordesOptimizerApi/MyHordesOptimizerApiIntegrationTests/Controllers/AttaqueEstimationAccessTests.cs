using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>Saisies réservées aux citoyens vivants de la ville ; identité lue dans le JWT, jamais dans la query.</summary>
    public class AttaqueEstimationAccessTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const string Body = "{\"day\":5,\"estim\":{\"_33\":{\"min\":3000,\"max\":4000}},\"planif\":{}}";
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public AttaqueEstimationAccessTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private (int townId, int alive, int dead, int outsider) Seed()
        {
            using var scope = _factory.Services.CreateScope();
            return AttackTestSupport.SeedTown(scope.ServiceProvider.GetRequiredService<MhoContext>(), 5);
        }

        private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

        [Fact]
        public async Task PostEstimations_CitoyenVivant_200()
        {
            var (townId, alive, _, _) = Seed();
            var response = await AttackTestSupport.CreateClientFor(_factory, alive).PostAsync($"/AttaqueEstimation/Estimations?townId={townId}", Json(Body));
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task PostEstimations_CitoyenMort_403()
        {
            var (townId, _, dead, _) = Seed();
            var response = await AttackTestSupport.CreateClientFor(_factory, dead).PostAsync($"/AttaqueEstimation/Estimations?townId={townId}", Json(Body));
            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task PostEstimations_Etranger_403_MemeAvecUnUserIdDeQueryValide()
        {
            var (townId, alive, _, outsider) = Seed();
            var response = await AttackTestSupport.CreateClientFor(_factory, outsider).PostAsync($"/AttaqueEstimation/Estimations?townId={townId}&userId={alive}", Json(Body));
            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task PostEstimations_SansJeton_401()
        {
            var (townId, _, _, _) = Seed();
            var response = await _factory.CreateClient().PostAsync($"/AttaqueEstimation/Estimations?townId={townId}", Json(Body));
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
}
