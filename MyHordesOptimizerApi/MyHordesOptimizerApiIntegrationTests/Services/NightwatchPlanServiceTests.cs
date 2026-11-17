using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Impl.Nightwatch;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Requiert 2026_11_13_town_nightwatch_plan.sql sur la base de test.</summary>
    public class NightwatchPlanServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public NightwatchPlanServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private INightwatchPlanService NewService(int userId)
        {
            var provider = _factory.Services.CreateScope().ServiceProvider;
            var userInfo = provider.GetRequiredService<IUserInfoProvider>();
            userInfo.UserId = userId;
            userInfo.TownDetail = null!;
            return new NightwatchPlanService(
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

        private static NightwatchPlanRequestDto NewRequest(int day = Day, string name = "Plan A") => new()
        {
            Day = day,
            Name = name,
            Content = new NightwatchPlanContentDto { AttackOverride = 1200, Instructions = "Monter tôt" }
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
            first.Content.AttackOverride.Should().Be(1200);
            first.AuthorId.Should().Be(town.Alive);
        }

        [Fact]
        public async Task Save_UpdateBumpsVersionAndStaleVersionIsConflict()
        {
            var town = Seed();
            var created = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest());

            var updated = await NewService(town.Alive).SavePlanAsync(town.TownId,
                new NightwatchPlanRequestDto { Id = created.Id, Version = created.Version, Day = Day, Name = "Renommé", Content = created.Content });
            var stale = async () => await NewService(town.Alive).SavePlanAsync(town.TownId,
                new NightwatchPlanRequestDto { Id = created.Id, Version = created.Version, Day = Day, Name = "Trop tard", Content = created.Content });

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
                new NightwatchPlanRequestDto { Id = created.Id, Day = Day, Name = "x", Content = created.Content });

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task Save_RejectsAnInvalidContent()
        {
            var town = Seed();
            var request = NewRequest();
            request.Content.Watchers.Add(new NightwatchWatcherDto { UserId = 1, Statuses = { "flying" } });

            var act = async () => await NewService(town.Alive).SavePlanAsync(town.TownId, request);

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task Save_RejectsDayBeforeTheFirst()
        {
            var town = Seed();

            var act = async () => await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(0));

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task Save_RejectsPlanIdFromAnotherTown()
        {
            var mine = Seed();
            var other = Seed();
            var foreign = await NewService(other.Alive).SavePlanAsync(other.TownId, NewRequest());

            var act = async () => await NewService(mine.Alive).SavePlanAsync(mine.TownId,
                new NightwatchPlanRequestDto { Id = foreign.Id, Version = foreign.Version, Day = Day, Name = "x", Content = foreign.Content });

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task SetEffective_MovesTheFlagWithoutBumpingTheVersion()
        {
            var town = Seed();
            var a = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(name: "A"));
            var b = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(name: "B"));

            var effective = await NewService(town.Alive).SetEffectiveAsync(town.TownId, b.Id);

            var plans = (await NewService(town.Alive).GetPlansAsync(town.TownId)).Plans;
            effective.IsEffective.Should().BeTrue();
            plans.Single(plan => plan.Id == a.Id).IsEffective.Should().BeFalse();
            plans.Single(plan => plan.Id == a.Id).Version.Should().Be(a.Version);
            plans.Single(plan => plan.Id == b.Id).Version.Should().Be(b.Version);
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
        public async Task SetEffective_KeepsASingleEffectivePerDay_EvenConcurrently()
        {
            var town = Seed();
            await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(name: "A"));
            var b = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(name: "B"));
            var c = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(name: "C"));

            await Task.WhenAll(
                NewService(town.Alive).SetEffectiveAsync(town.TownId, b.Id),
                NewService(town.Alive).SetEffectiveAsync(town.TownId, c.Id));

            NewContext().TownNightwatchPlans.Count(plan => plan.IdTown == town.TownId && plan.Day == Day && plan.IsEffective).Should().Be(1);
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
        public async Task Delete_RejectsPlanIdFromAnotherTown()
        {
            var mine = Seed();
            var other = Seed();
            var foreign = await NewService(other.Alive).SavePlanAsync(other.TownId, NewRequest());

            var act = async () => await NewService(mine.Alive).DeletePlanAsync(mine.TownId, foreign.Id);

            await act.Should().ThrowAsync<MhoForbiddenException>();
            (await NewService(other.Alive).GetPlansAsync(other.TownId)).Plans.Should().ContainSingle(plan => plan.Id == foreign.Id);
        }

        [Fact]
        public async Task Outsider_ReadsNothingAndCannotWrite()
        {
            var town = Seed();
            var created = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest());

            var read = await NewService(town.Outsider).GetPlansAsync(town.TownId);
            var write = async () => await NewService(town.Outsider).SavePlanAsync(town.TownId, NewRequest());
            var setEffective = async () => await NewService(town.Outsider).SetEffectiveAsync(town.TownId, created.Id);
            var delete = async () => await NewService(town.Outsider).DeletePlanAsync(town.TownId, created.Id);

            read.Access.IsCitizen.Should().BeFalse();
            read.Access.CanEdit.Should().BeFalse();
            read.Plans.Should().BeEmpty();
            await write.Should().ThrowAsync<MhoForbiddenException>();
            await setEffective.Should().ThrowAsync<MhoForbiddenException>();
            await delete.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task DeadCitizen_CanReadAndWrite()
        {
            var town = Seed();

            var created = await NewService(town.Dead).SavePlanAsync(town.TownId, NewRequest());

            (await NewService(town.Dead).GetPlansAsync(town.TownId)).Plans.Should().ContainSingle(plan => plan.Id == created.Id);
        }
    }
}
