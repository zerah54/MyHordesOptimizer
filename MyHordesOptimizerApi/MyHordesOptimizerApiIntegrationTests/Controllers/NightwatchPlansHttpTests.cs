using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch.Request;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.Nightwatch;
using MyHordesOptimizerApi.Services.Impl.Locks;
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
    /// <summary>Requiert 2026_11_13_town_nightwatch_plan.sql sur la base de test.</summary>
    public class NightwatchPlansHttpTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public NightwatchPlansHttpTests(MyHordesOptimizerApplicationFactory factory)
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
            var request = new NightwatchPlanRequestDto { Day = Day, Name = "Plan A", Content = new NightwatchPlanContentDto() };

            var saved = await citizen.PutAsJsonAsync($"/NightwatchPlans/{townId}/plans", request);
            var listed = await citizen.GetFromJsonAsync<NightwatchPlansDto>($"/NightwatchPlans/{townId}");
            var outsiderList = await outsider.GetFromJsonAsync<NightwatchPlansDto>($"/NightwatchPlans/{townId}");
            var outsiderWrite = await outsider.PutAsJsonAsync($"/NightwatchPlans/{townId}/plans", request);

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
                new NightwatchPlanRequestDto { Day = Day, Name = "A", Content = new NightwatchPlanContentDto() }, "mine")).Content.ReadFromJsonAsync<NightwatchPlanDto>())!;

            var first = await PutPlanAsync(citizen, townId, Edit(created, "B"), "mine");
            var stale = await PutPlanAsync(citizen, townId, Edit(created, "C"), "mine");
            var invalid = await citizen.PutAsJsonAsync($"/NightwatchPlans/{townId}/plans",
                new NightwatchPlanRequestDto { Day = Day, Name = "", Content = new NightwatchPlanContentDto() });

            first.StatusCode.Should().Be(HttpStatusCode.OK);
            stale.StatusCode.Should().Be(HttpStatusCode.Conflict);
            invalid.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task WithoutTokenTheRoutesAreUnauthorized()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);

            var response = await factory.CreateClient().GetAsync("/NightwatchPlans/1");

            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        private const string Header = "Mho-Hub-Connection";

        private static async Task<HttpResponseMessage> PutPlanAsync(HttpClient client, int townId, NightwatchPlanRequestDto body, string? connectionId)
        {
            var message = new HttpRequestMessage(HttpMethod.Put, $"/NightwatchPlans/{townId}/plans") { Content = JsonContent.Create(body) };
            if (connectionId is not null)
            {
                message.Headers.Add(Header, connectionId);
            }
            return await client.SendAsync(message);
        }

        private static async Task<NightwatchPlanDto> CreatePlanAsync(HttpClient client, int townId)
        {
            var response = await PutPlanAsync(client, townId, new NightwatchPlanRequestDto { Day = Day, Name = "A", Content = new NightwatchPlanContentDto() }, null);
            return (await response.Content.ReadFromJsonAsync<NightwatchPlanDto>())!;
        }

        private static NightwatchPlanRequestDto Edit(NightwatchPlanDto plan, string name)
        {
            return new NightwatchPlanRequestDto { Id = plan.Id, Version = plan.Version, Day = Day, Name = name, Content = plan.Content };
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
            factory.Services.GetRequiredService<NightwatchPlanLockRegistry>().TryAcquire(new NightwatchPlanLockKey(townId, plan.Id), new LockHolder("other", 99));

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
            factory.Services.GetRequiredService<NightwatchPlanLockRegistry>().TryAcquire(new NightwatchPlanLockKey(townId, plan.Id), new LockHolder("mine", aliveUserId));

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
            var registry = factory.Services.GetRequiredService<NightwatchPlanLockRegistry>();
            var key = new NightwatchPlanLockKey(townId, plan.Id);
            registry.TryAcquire(key, new LockHolder("mine", aliveUserId));
            time.Advance(NightwatchPlanLockRegistry.IdleTimeout);

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
            factory.Services.GetRequiredService<NightwatchPlanLockRegistry>().IsHeldBy(new NightwatchPlanLockKey(townId, plan.Id), "mine").Should().BeTrue();
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
            factory.Services.GetRequiredService<NightwatchPlanLockRegistry>().HolderOf(new NightwatchPlanLockKey(townId, plan.Id)).Should().BeNull();
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
            var registry = factory.Services.GetRequiredService<NightwatchPlanLockRegistry>();
            var key = new NightwatchPlanLockKey(townId, plan.Id);
            registry.TryAcquire(key, new LockHolder("mine", aliveUserId));
            var twoThirds = NightwatchPlanLockRegistry.IdleTimeout * 2 / 3;
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

            var response = await PutPlanAsync(citizen, townId, new NightwatchPlanRequestDto { Day = Day, Name = "A", Content = new NightwatchPlanContentDto() }, "mine");
            var plan = await response.Content.ReadFromJsonAsync<NightwatchPlanDto>();

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            factory.Services.GetRequiredService<NightwatchPlanLockRegistry>().IsHeldBy(new NightwatchPlanLockKey(townId, plan!.Id), "mine").Should().BeTrue();
        }

        [Fact]
        public async Task DeletePlan_TenueParUneAutreConnexion_Renvoie423()
        {
            using var factory = _factory.WithWebHostBuilder(UseRealTownAccess);
            var context = factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            var citizen = CreateClient(factory, aliveUserId);
            var plan = await CreatePlanAsync(citizen, townId);
            factory.Services.GetRequiredService<NightwatchPlanLockRegistry>().TryAcquire(new NightwatchPlanLockKey(townId, plan.Id), new LockHolder("other", 99));
            var message = new HttpRequestMessage(HttpMethod.Delete, $"/NightwatchPlans/{townId}/plans/{plan.Id}");
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
            factory.Services.GetRequiredService<NightwatchPlanLockRegistry>().TryAcquire(new NightwatchPlanLockKey(townId, plan.Id), new LockHolder("other", 99));

            var response = await citizen.PutAsync($"/NightwatchPlans/{townId}/plans/{plan.Id}/effective", null);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
