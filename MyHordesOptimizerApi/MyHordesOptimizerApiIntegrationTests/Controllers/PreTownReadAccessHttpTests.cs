using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans.Request;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Services;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>Lecture d'une pré-ville par route (<c>/BuildingPlans/{mapId}</c>) : réservée à ses membres, archive comprise.</summary>
    public class PreTownReadAccessHttpTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public PreTownReadAccessHttpTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private static void UseRealTownAccess(IWebHostBuilder builder)
        {
            builder.ConfigureTestServices(services => services.AddScoped<ITownAccessService, TownAccessService>());
        }

        private static HttpClient CreateClient<TEntryPoint>(WebApplicationFactory<TEntryPoint> factory, int userId) where TEntryPoint : class
        {
            var client = factory.CreateClient();
            using var scope = factory.Services.CreateScope();
            var token = scope.ServiceProvider.GetRequiredService<IAuthenticationService>()
                .CreateToken(new SimpleMeDto { Id = userId, UserName = "test-user-" + userId }, "irrelevant-user-key")
                .AccessToken;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return client;
        }

        [Fact]
        public async Task NonMembre_Lecture403()
        {
            var (_, mapId, _, outsiderId) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: false);

            var response = await CreateClient(_factory, outsiderId).GetAsync($"/BuildingPlans/{mapId}");

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task Membre_LectureAccepteeMemeLiee_EcritureRefuseeSiLiee()
        {
            var (_, mapId, memberId, _) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: true);
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var member = CreateClient(factory, memberId);
            var request = new BuildingPlanRequestDto { Day = 5, Name = "Plan", Content = new BuildingPlanContentDto() };

            var read = await member.GetAsync($"/BuildingPlans/{mapId}");
            var write = await member.PutAsJsonAsync($"/BuildingPlans/{mapId}/plans", request);

            read.StatusCode.Should().Be(HttpStatusCode.OK);
            write.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task Membre_PreVilleNonLiee_EcritureAcceptee()
        {
            var (_, mapId, memberId, _) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: false);
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var request = new BuildingPlanRequestDto { Day = 5, Name = "Plan", Content = new BuildingPlanContentDto() };

            var write = await CreateClient(factory, memberId).PutAsJsonAsync($"/BuildingPlans/{mapId}/plans", request);

            write.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task VilleReelle_NonCitoyen_ResteLisibleSansAccesCitoyen()
        {
            using var scope = _factory.Services.CreateScope();
            var (townId, _, _, outsiderId) = AttackTestSupport.SeedTown(scope.ServiceProvider.GetRequiredService<MhoContext>(), day: 5);
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);

            var list = await CreateClient(factory, outsiderId).GetFromJsonAsync<BuildingPlansDto>($"/BuildingPlans/{townId}");

            list!.Access.IsCitizen.Should().BeFalse();
        }

        [Fact]
        public async Task ParametreDeRouteTownId_NonMembre403_MembreAccepte()
        {
            var (_, mapId, memberId, outsiderId) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: false);

            var outsider = await CreateClient(_factory, outsiderId).GetAsync($"/Expeditions/{mapId}/1");
            var member = await CreateClient(_factory, memberId).GetAsync($"/Expeditions/{mapId}/1");

            outsider.StatusCode.Should().Be(HttpStatusCode.Forbidden);
            member.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task ParametreDeRequeteTownId_PseudoMapIdOuIdTown_NonMembre403()
        {
            var (preTownId, mapId, memberId, outsiderId) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: false);
            var outsider = CreateClient(_factory, outsiderId);

            var byMapId = await outsider.GetAsync($"/UserAccount/{outsiderId}/pictos?townId={mapId}");
            var byIdTown = await outsider.GetAsync($"/UserAccount/{outsiderId}/pictos?townId={PreTownIds.ToIdTown(preTownId)}");
            var member = await CreateClient(_factory, memberId).GetAsync($"/UserAccount/{memberId}/pictos?townId={mapId}");

            byMapId.StatusCode.Should().Be(HttpStatusCode.Forbidden);
            byIdTown.StatusCode.Should().Be(HttpStatusCode.Forbidden);
            member.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
        }

        [Theory]
        [InlineData("townId", true)]
        [InlineData("townId", false)]
        public async Task ParametreDeRequeteRepete_PseudoMapIdEnPremiereOuSecondePosition_NonMembre403(string key, bool pseudoFirst)
        {
            var (_, mapId, _, outsiderId) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: false);
            var query = pseudoFirst ? $"{key}={mapId}&{key}=5" : $"{key}=5&{key}={mapId}";

            var response = await CreateClient(_factory, outsiderId).GetAsync($"/UserAccount/{outsiderId}/pictos?{query}");

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task MapIdEnQueryRepete_NonMembre403()
        {
            var (_, mapId, _, outsiderId) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: false);

            var response = await CreateClient(_factory, outsiderId).GetAsync($"/UserAccount/{outsiderId}/pictos?mapId=5&mapId={mapId}");

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }
    }
}
