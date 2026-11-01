using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.BuildingPlans;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Requiert 2026_10_13_town_building.sql et 2026_10_13_town_building_plan.sql sur la base de test.</summary>
    public class BuildingPlanServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public BuildingPlanServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private IBuildingPlanService NewService(int userId, int? tokenMapId = null)
        {
            var provider = _factory.Services.CreateScope().ServiceProvider;
            var userInfo = provider.GetRequiredService<IUserInfoProvider>();
            userInfo.UserId = userId;
            userInfo.TownDetail = tokenMapId.HasValue ? new SimpleMeTownDetailDto { TownId = tokenMapId.Value } : null!;
            return new BuildingPlanService(
                provider.GetRequiredService<MhoContext>(),
                userInfo,
                new TownAccessService(provider.GetRequiredService<IServiceScopeFactory>(), userInfo),
                provider.GetRequiredService<TownSyncLock>(),
                provider.GetRequiredService<IMapper>());
        }

        private MhoContext NewContext() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();

        private (int TownId, int Alive, int Dead, int Outsider) Seed()
        {
            var seeded = AttackTestSupport.SeedTown(NewContext(), Day);
            return (seeded.townId, seeded.aliveUserId, seeded.deadUserId, seeded.outsiderUserId);
        }

        private static BuildingPlanRequestDto NewRequest(int day = Day, string name = "Plan A") => new()
        {
            Day = day,
            Name = name,
            Content = new BuildingPlanContentDto { AllowedOverflow = 10 }
        };

        [Fact]
        public async Task Save_CreatesAndFirstPlanOfTheDayBecomesEffective()
        {
            var town = Seed();

            var first = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest());
            var second = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(name: "Plan B"));

            first.IsEffective.Should().BeTrue();
            second.IsEffective.Should().BeFalse();
            first.Version.Should().Be(0);
            first.Content.AllowedOverflow.Should().Be(10);
        }

        [Fact]
        public async Task Save_UpdateBumpsVersionAndStaleVersionIsConflict()
        {
            var town = Seed();
            var created = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest());

            var updated = await NewService(town.Alive).SavePlanAsync(town.TownId,
                new BuildingPlanRequestDto { Id = created.Id, Version = created.Version, Day = Day, Name = "Renommé", Content = created.Content });
            var stale = async () => await NewService(town.Alive).SavePlanAsync(town.TownId,
                new BuildingPlanRequestDto { Id = created.Id, Version = created.Version, Day = Day, Name = "Trop tard", Content = created.Content });

            updated.Version.Should().Be(created.Version + 1);
            updated.Name.Should().Be("Renommé");
            await stale.Should().ThrowAsync<MhoConflictException>();
        }

        [Fact]
        public async Task Save_UpdateWithoutVersionIsRejected()
        {
            var town = Seed();
            var created = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest());

            var act = async () => await NewService(town.Alive).SavePlanAsync(town.TownId,
                new BuildingPlanRequestDto { Id = created.Id, Day = Day, Name = "x", Content = created.Content });

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task Save_TwoConcurrentUpdatesWithTheSameVersion_OnlyOneWins()
        {
            var town = Seed();
            var created = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest());
            BuildingPlanRequestDto Update(string name) => new() { Id = created.Id, Version = created.Version, Day = Day, Name = name, Content = created.Content };

            var results = await Task.WhenAll(
                Attempt(() => NewService(town.Alive).SavePlanAsync(town.TownId, Update("A"))),
                Attempt(() => NewService(town.Alive).SavePlanAsync(town.TownId, Update("B"))));

            results.Count(succeeded => succeeded).Should().Be(1);
        }

        private static async Task<bool> Attempt(Func<Task> action)
        {
            try { await action(); return true; }
            catch (MhoConflictException) { return false; }
        }

        [Fact]
        public async Task SetEffective_MovesTheFlagAndKeepsASingleEffectivePerDay_EvenConcurrently()
        {
            var town = Seed();
            await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(name: "A"));
            var b = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(name: "B"));
            var c = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(name: "C"));

            await Task.WhenAll(
                NewService(town.Alive).SetEffectiveAsync(town.TownId, b.Id),
                NewService(town.Alive).SetEffectiveAsync(town.TownId, c.Id));

            NewContext().TownBuildingPlans.Count(plan => plan.IdTown == town.TownId && plan.Day == Day && plan.IsEffective).Should().Be(1);
        }

        [Fact]
        public async Task SetEffective_OnlyWithinTheSameDay()
        {
            var town = Seed();
            var today = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(Day));
            var tomorrow = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(Day + 1));
            await NewService(town.Alive).SetEffectiveAsync(town.TownId, tomorrow.Id);

            var plans = await NewService(town.Alive).GetPlansAsync(town.TownId);

            plans.Plans.Single(plan => plan.Id == today.Id).IsEffective.Should().BeTrue();
            plans.Plans.Single(plan => plan.Id == tomorrow.Id).IsEffective.Should().BeTrue();
        }

        [Fact]
        public async Task Delete_RemovesThePlan()
        {
            var town = Seed();
            var created = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest());

            await NewService(town.Alive).DeletePlanAsync(town.TownId, created.Id);

            (await NewService(town.Alive).GetPlansAsync(town.TownId)).Plans.Should().NotContain(plan => plan.Id == created.Id);
        }

        [Fact]
        public async Task Outsider_ReadsNothingAndCannotWrite()
        {
            var town = Seed();
            await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest());

            var read = await NewService(town.Outsider).GetPlansAsync(town.TownId);
            var write = async () => await NewService(town.Outsider).SavePlanAsync(town.TownId, NewRequest());

            read.Access.IsCitizen.Should().BeFalse();
            read.Plans.Should().BeEmpty();
            await write.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task DeadCitizen_CanReadAndWrite()
        {
            var town = Seed();

            var created = await NewService(town.Dead).SavePlanAsync(town.TownId, NewRequest());

            (await NewService(town.Dead).GetPlansAsync(town.TownId)).Plans.Should().ContainSingle(plan => plan.Id == created.Id);
        }

        [Fact]
        public async Task Save_RejectsPlanIdFromAnotherTown()
        {
            var mine = Seed();
            var other = Seed();
            var foreign = await NewService(other.Alive).SavePlanAsync(other.TownId, NewRequest());

            var act = async () => await NewService(mine.Alive).SavePlanAsync(mine.TownId,
                new BuildingPlanRequestDto { Id = foreign.Id, Version = foreign.Version, Day = Day, Name = "x", Content = foreign.Content });

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task Save_RejectsDayBeforeTheFirst()
        {
            var town = Seed();

            var tooEarly = async () => await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(0));

            await tooEarly.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task Save_AcceptsAFarFutureDay()
        {
            var town = Seed();

            var saved = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(Day + 60));

            saved.Day.Should().Be(Day + 60);
        }

        [Fact]
        public async Task Settings_RoundTripAndStaleVersionIsConflict()
        {
            var town = Seed();

            var first = await NewService(town.Alive).SaveSettingsAsync(town.TownId,
                new BuildingPlanSettingsRequestDto { ItemValues = new() { { 5, 2 } } });
            var stale = async () => await NewService(town.Alive).SaveSettingsAsync(town.TownId,
                new BuildingPlanSettingsRequestDto { ItemValues = new() { { 5, 3 } }, Version = first.SettingsVersion + 5 });
            var second = await NewService(town.Alive).SaveSettingsAsync(town.TownId,
                new BuildingPlanSettingsRequestDto { ItemValues = new() { { 5, 3 } }, Version = first.SettingsVersion });

            first.ItemValues[5].Should().Be(2);
            second.ItemValues[5].Should().Be(3);
            second.SettingsVersion.Should().Be(first.SettingsVersion + 1);
            await stale.Should().ThrowAsync<MhoConflictException>();
        }

        [Fact]
        public async Task GetState_ReturnsTheSyncedBuildingsOfTheTownOnly()
        {
            var town = Seed();
            var other = Seed();
            var db = NewContext();
            var building = db.Buildings.First();
            db.TownBuildings.Add(new TownBuilding { IdTown = town.TownId, IdBuilding = building.IdBuilding, IsBuilt = true, PaCurrent = 20, ApRemaining = 0, ResourcesCurrent = "[{\"itemId\":7,\"count\":2}]" });
            db.TownBuildings.Add(new TownBuilding { IdTown = other.TownId, IdBuilding = building.IdBuilding, IsBuilt = false });
            db.TownDefenses.Add(new TownDefense { IdTown = town.TownId, Total = 1352, Buildings = 700 });
            db.SaveChanges();

            var state = await NewService(town.Alive).GetStateAsync(town.TownId);

            var row = state.Buildings.Should().ContainSingle().Subject;
            row.BuildingId.Should().Be(building.IdBuilding);
            row.IsBuilt.Should().BeTrue();
            row.Resources.Should().ContainSingle(resource => resource.ItemId == 7 && resource.Count == 2);
            state.Defense!.Total.Should().Be(1352);
            state.Defense.Buildings.Should().Be(700);
        }

        [Fact]
        public async Task GetState_HasNoDefenseUntilAnUpdateReportedIt()
        {
            var town = Seed();

            (await NewService(town.Alive).GetStateAsync(town.TownId)).Defense.Should().BeNull();
        }

        [Fact]
        public async Task GetState_IsEmptyForAnOutsider()
        {
            var town = Seed();

            (await NewService(town.Outsider).GetStateAsync(town.TownId)).Buildings.Should().BeEmpty();
        }
    }
}
