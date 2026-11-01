using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans.Request;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>Requiert 2026_10_13_town_building.sql et 2026_10_13_town_building_plan.sql sur la base de test.</summary>
    public class BuildingPlansHttpTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public BuildingPlansHttpTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        /// <summary>L'hôte de test enregistre un ITownAccessService permissif : on le remplace par le vrai.</summary>
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
        public async Task CitizenCanSaveAndListAPlan_AndAnOutsiderGetsNothing()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, outsiderUserId) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);
            var outsider = CreateClient(factory, outsiderUserId);
            var request = new BuildingPlanRequestDto { Day = Day, Name = "Plan A", Content = new BuildingPlanContentDto() };

            var saved = await citizen.PutAsJsonAsync($"/BuildingPlans/{townId}/plans", request);
            var listed = await citizen.GetFromJsonAsync<BuildingPlansDto>($"/BuildingPlans/{townId}");
            var outsiderList = await outsider.GetFromJsonAsync<BuildingPlansDto>($"/BuildingPlans/{townId}");
            var outsiderWrite = await outsider.PutAsJsonAsync($"/BuildingPlans/{townId}/plans", request);

            saved.StatusCode.Should().Be(HttpStatusCode.OK);
            listed!.Plans.Should().ContainSingle(plan => plan.Name == "Plan A");
            outsiderList!.Access.IsCitizen.Should().BeFalse();
            outsiderList.Plans.Should().BeEmpty();
            outsiderWrite.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task StaleVersionReturns409AndInvalidContentReturns400()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);
            var created = await (await citizen.PutAsJsonAsync($"/BuildingPlans/{townId}/plans",
                new BuildingPlanRequestDto { Day = Day, Name = "A", Content = new BuildingPlanContentDto() })).Content.ReadFromJsonAsync<BuildingPlanDto>();

            var first = await citizen.PutAsJsonAsync($"/BuildingPlans/{townId}/plans",
                new BuildingPlanRequestDto { Id = created!.Id, Version = created.Version, Day = Day, Name = "B", Content = created.Content });
            var stale = await citizen.PutAsJsonAsync($"/BuildingPlans/{townId}/plans",
                new BuildingPlanRequestDto { Id = created.Id, Version = created.Version, Day = Day, Name = "C", Content = created.Content });
            var invalid = await citizen.PutAsJsonAsync($"/BuildingPlans/{townId}/plans",
                new BuildingPlanRequestDto { Day = Day, Name = "", Content = new BuildingPlanContentDto() });

            first.StatusCode.Should().Be(HttpStatusCode.OK);
            stale.StatusCode.Should().Be(HttpStatusCode.Conflict);
            invalid.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task WithoutTokenTheRoutesAreUnauthorized()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);

            var response = await factory.CreateClient().GetAsync("/BuildingPlans/1");

            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
}
