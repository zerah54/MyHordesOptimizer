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
using MyHordesOptimizerApi.Services.Impl.BuildingPlans;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using System;
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

        /// <summary>Horloge des verrous avancée à la main ; part de l'heure réelle pour garder les jetons valides.</summary>
        private sealed class ManualTimeProvider : TimeProvider
        {
            private DateTimeOffset _now = DateTimeOffset.UtcNow;

            public override DateTimeOffset GetUtcNow() => _now;

            public void Advance(TimeSpan delta) => _now += delta;
        }

        private WebApplicationFactory<Program> FactoryWithClock(TimeProvider time)
        {
            return _factory.WithWebHostBuilder(builder =>
            {
                UseRealTownAccess(builder);
                builder.ConfigureTestServices(services => services.AddSingleton(time));
            });
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
            var created = (await (await PutPlanAsync(citizen, townId,
                new BuildingPlanRequestDto { Day = Day, Name = "A", Content = new BuildingPlanContentDto() }, "mine")).Content.ReadFromJsonAsync<BuildingPlanDto>())!;

            var first = await PutPlanAsync(citizen, townId, Edit(created, "B"), "mine");
            var stale = await PutPlanAsync(citizen, townId, Edit(created, "C"), "mine");
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

        private const string Header = "Mho-Hub-Connection";

        private static async Task<HttpResponseMessage> PutPlanAsync(HttpClient client, int townId, BuildingPlanRequestDto body, string? connectionId)
        {
            var message = new HttpRequestMessage(HttpMethod.Put, $"/BuildingPlans/{townId}/plans") { Content = JsonContent.Create(body) };
            if (connectionId is not null)
            {
                message.Headers.Add(Header, connectionId);
            }
            return await client.SendAsync(message);
        }

        private static async Task<BuildingPlanDto> CreatePlanAsync(HttpClient client, int townId)
        {
            var response = await PutPlanAsync(client, townId, new BuildingPlanRequestDto { Day = Day, Name = "A", Content = new BuildingPlanContentDto() }, null);
            return (await response.Content.ReadFromJsonAsync<BuildingPlanDto>())!;
        }

        private static BuildingPlanRequestDto Edit(BuildingPlanDto plan, string name)
        {
            return new BuildingPlanRequestDto { Id = plan.Id, Version = plan.Version, Day = Day, Name = name, Content = plan.Content };
        }

        [Fact]
        public async Task SavePlan_PropositionExistanteSansEnTete_Renvoie423()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);
            var plan = await CreatePlanAsync(citizen, townId);

            var response = await PutPlanAsync(citizen, townId, Edit(plan, "B"), null);

            response.StatusCode.Should().Be((HttpStatusCode)423);
        }

        [Fact]
        public async Task SavePlan_PropositionTenueParUneAutreConnexion_Renvoie423()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);
            var plan = await CreatePlanAsync(citizen, townId);
            factory.Services.GetRequiredService<BuildingPlanLockRegistry>().TryAcquire(new PlanLockKey(townId, plan.Id), new PlanLockHolder("other", 99));

            var response = await PutPlanAsync(citizen, townId, Edit(plan, "B"), "mine");

            response.StatusCode.Should().Be((HttpStatusCode)423);
        }

        [Fact]
        public async Task SavePlan_PropositionTenueParLAppelant_Enregistre()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);
            var plan = await CreatePlanAsync(citizen, townId);
            factory.Services.GetRequiredService<BuildingPlanLockRegistry>().TryAcquire(new PlanLockKey(townId, plan.Id), new PlanLockHolder("mine", aliveUserId));

            var response = await PutPlanAsync(citizen, townId, Edit(plan, "B"), "mine");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task SavePlan_MainExpireeTenueParLAppelant_EnregistreEtReprendLaMain()
        {
            var time = new ManualTimeProvider();
            using var factory = FactoryWithClock(time);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);
            var plan = await CreatePlanAsync(citizen, townId);
            var registry = factory.Services.GetRequiredService<BuildingPlanLockRegistry>();
            var key = new PlanLockKey(townId, plan.Id);
            registry.TryAcquire(key, new PlanLockHolder("mine", aliveUserId));
            time.Advance(BuildingPlanLockRegistry.IdleTimeout);

            var response = await PutPlanAsync(citizen, townId, Edit(plan, "B"), "mine");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            registry.IsHeldBy(key, "mine").Should().BeTrue();
        }

        [Fact]
        public async Task SavePlan_MainLibreJamaisPrise_EnregistreEtPrendLaMain()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);
            var plan = await CreatePlanAsync(citizen, townId);

            var response = await PutPlanAsync(citizen, townId, Edit(plan, "B"), "mine");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            factory.Services.GetRequiredService<BuildingPlanLockRegistry>().IsHeldBy(new PlanLockKey(townId, plan.Id), "mine").Should().BeTrue();
        }

        [Fact]
        public async Task SavePlan_MainLibreDemandeeParUnNonCitoyen_Renvoie403SansDonnerLaMain()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, outsiderUserId) = AttackTestSupport.SeedTown(context, Day);
            var plan = await CreatePlanAsync(CreateClient(factory, aliveUserId), townId);

            var response = await PutPlanAsync(CreateClient(factory, outsiderUserId), townId, Edit(plan, "B"), "outsider");

            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
            factory.Services.GetRequiredService<BuildingPlanLockRegistry>().HolderOf(new PlanLockKey(townId, plan.Id)).Should().BeNull();
        }

        [Fact]
        public async Task SavePlan_Reussi_RepousseLExpirationDeLaMain()
        {
            var time = new ManualTimeProvider();
            using var factory = FactoryWithClock(time);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);
            var plan = await CreatePlanAsync(citizen, townId);
            var registry = factory.Services.GetRequiredService<BuildingPlanLockRegistry>();
            var key = new PlanLockKey(townId, plan.Id);
            registry.TryAcquire(key, new PlanLockHolder("mine", aliveUserId));
            var twoThirds = BuildingPlanLockRegistry.IdleTimeout * 2 / 3;
            time.Advance(twoThirds);

            var response = await PutPlanAsync(citizen, townId, Edit(plan, "B"), "mine");
            time.Advance(twoThirds);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            registry.IsHeldBy(key, "mine").Should().BeTrue();
        }

        [Fact]
        public async Task SavePlan_Creation_DonneLaMainALaConnexionDeLEnTete()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);

            var response = await PutPlanAsync(citizen, townId, new BuildingPlanRequestDto { Day = Day, Name = "A", Content = new BuildingPlanContentDto() }, "mine");
            var plan = await response.Content.ReadFromJsonAsync<BuildingPlanDto>();

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            factory.Services.GetRequiredService<BuildingPlanLockRegistry>().IsHeldBy(new PlanLockKey(townId, plan!.Id), "mine").Should().BeTrue();
        }

        [Fact]
        public async Task DeletePlan_TenueParUneAutreConnexion_Renvoie423()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);
            var plan = await CreatePlanAsync(citizen, townId);
            factory.Services.GetRequiredService<BuildingPlanLockRegistry>().TryAcquire(new PlanLockKey(townId, plan.Id), new PlanLockHolder("other", 99));
            var message = new HttpRequestMessage(HttpMethod.Delete, $"/BuildingPlans/{townId}/plans/{plan.Id}");
            message.Headers.Add(Header, "mine");

            var response = await citizen.SendAsync(message);

            response.StatusCode.Should().Be((HttpStatusCode)423);
        }

        [Fact]
        public async Task SetEffective_IgnoreLeVerrou()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);
            var plan = await CreatePlanAsync(citizen, townId);
            factory.Services.GetRequiredService<BuildingPlanLockRegistry>().TryAcquire(new PlanLockKey(townId, plan.Id), new PlanLockHolder("other", 99));

            var response = await citizen.PutAsync($"/BuildingPlans/{townId}/plans/{plan.Id}/effective", null);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
