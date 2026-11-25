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
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Requiert 2026_11_13_town_nightwatch_plan.sql et 2026_11_24_town_nightwatch_simulation.sql sur la base de test.</summary>
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

        private const int SimulationDay = 10;

        private (int TownId, int Alive) SeedSimulationTown()
        {
            var seeded = AttackTestSupport.SeedTown(NewContext(), SimulationDay);
            return (seeded.townId, seeded.aliveUserId);
        }

        private static NightwatchSimulationRequestDto NewSimulation(int lastDay, string name = "Simu") => new()
        {
            Name = name,
            LastDay = lastDay,
            Stock = new Dictionary<int, int> { [1] = 3 }
        };

        private static NightwatchSimulationRequestDto Update(NightwatchSimulationDto simulation, int lastDay) => new()
        {
            Id = simulation.Id,
            Version = simulation.Version,
            Name = simulation.Name,
            LastDay = lastDay,
            Stock = simulation.Stock
        };

        private async Task<List<NightwatchPlanDto>> SimulationPlansAsync(int townId, int userId, int simulationId)
        {
            return (await NewService(userId).GetPlansAsync(townId)).Plans.Where(plan => plan.SimulationId == simulationId).OrderBy(plan => plan.Day).ToList();
        }

        [Fact]
        public async Task SaveSimulation_CreatesOneNonEffectivePlanPerDay()
        {
            var town = SeedSimulationTown();

            var simulation = await NewService(town.Alive).SaveSimulationAsync(town.TownId, NewSimulation(12));

            var plans = await SimulationPlansAsync(town.TownId, town.Alive, simulation.Id);
            plans.Select(plan => plan.Day).Should().Equal(10, 11, 12);
            plans.Should().OnlyContain(plan => !plan.IsEffective && plan.Name == "Simu");
            simulation.LastDay.Should().Be(12);
            simulation.Stock.Should().Equal(new Dictionary<int, int> { [1] = 3 });
        }

        [Fact]
        public async Task SaveSimulation_ShrinkDeletesAndDetachesEffective()
        {
            var town = SeedSimulationTown();
            var simulation = await NewService(town.Alive).SaveSimulationAsync(town.TownId, NewSimulation(13));
            var plans = await SimulationPlansAsync(town.TownId, town.Alive, simulation.Id);
            var day12 = plans.Single(plan => plan.Day == 12);
            var day13 = plans.Single(plan => plan.Day == 13);
            await NewService(town.Alive).SetEffectiveAsync(town.TownId, day13.Id);

            var updated = await NewService(town.Alive).SaveSimulationAsync(town.TownId, Update(simulation, 11));

            var all = (await NewService(town.Alive).GetPlansAsync(town.TownId)).Plans;
            updated.LastDay.Should().Be(11);
            all.Should().NotContain(plan => plan.Id == day12.Id);
            var detached = all.Single(plan => plan.Id == day13.Id);
            detached.SimulationId.Should().BeNull();
            detached.IsEffective.Should().BeTrue();
            all.Where(plan => plan.SimulationId == simulation.Id).Select(plan => plan.Day).Should().BeEquivalentTo(new[] { 10, 11 });
        }

        [Fact]
        public async Task SaveSimulation_ExtendCreatesMissingDays()
        {
            var town = SeedSimulationTown();
            var simulation = await NewService(town.Alive).SaveSimulationAsync(town.TownId, NewSimulation(11));

            await NewService(town.Alive).SaveSimulationAsync(town.TownId, Update(simulation, 13));

            var plans = await SimulationPlansAsync(town.TownId, town.Alive, simulation.Id);
            plans.Select(plan => plan.Day).Should().Equal(10, 11, 12, 13);
            plans.Should().OnlyContain(plan => !plan.IsEffective);
        }

        [Fact]
        public async Task SaveSimulation_StaleVersion_Conflicts()
        {
            var town = SeedSimulationTown();
            var simulation = await NewService(town.Alive).SaveSimulationAsync(town.TownId, NewSimulation(11));
            var updated = await NewService(town.Alive).SaveSimulationAsync(town.TownId, Update(simulation, 11));

            var stale = async () => await NewService(town.Alive).SaveSimulationAsync(town.TownId, Update(simulation, 12));

            updated.Version.Should().Be(simulation.Version + 1);
            await stale.Should().ThrowAsync<MhoConflictException>();
        }

        [Fact]
        public async Task SavePlan_SecondPlanSameDaySameSimulation_Rejected()
        {
            var town = SeedSimulationTown();
            var simulation = await NewService(town.Alive).SaveSimulationAsync(town.TownId, NewSimulation(10));

            var act = async () => await NewService(town.Alive).SavePlanAsync(town.TownId,
                new NightwatchPlanRequestDto { Day = 10, Name = "Bis", SimulationId = simulation.Id, Content = new NightwatchPlanContentDto() });

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Theory]
        [InlineData(13)]
        [InlineData(9)]
        public async Task SavePlan_WithSimulation_DayOutsideCurrentDayToLastDay_Rejected(int day)
        {
            var town = SeedSimulationTown();
            var simulation = await NewService(town.Alive).SaveSimulationAsync(town.TownId, NewSimulation(12));

            var act = async () => await NewService(town.Alive).SavePlanAsync(town.TownId,
                new NightwatchPlanRequestDto { Day = day, Name = "Hors bornes", SimulationId = simulation.Id, Content = new NightwatchPlanContentDto() });

            await act.Should().ThrowAsync<MhoTechnicalException>();
            (await SimulationPlansAsync(town.TownId, town.Alive, simulation.Id)).Select(plan => plan.Day).Should().Equal(10, 11, 12);
        }

        [Fact]
        public async Task SavePlan_WithSimulationOfAnotherTown_Rejected()
        {
            var mine = SeedSimulationTown();
            var other = SeedSimulationTown();
            var foreign = await NewService(other.Alive).SaveSimulationAsync(other.TownId, NewSimulation(10));

            var act = async () => await NewService(mine.Alive).SavePlanAsync(mine.TownId,
                new NightwatchPlanRequestDto { Day = 11, Name = "x", SimulationId = foreign.Id, Content = new NightwatchPlanContentDto() });

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task SavePlan_WithSimulation_IsNotEffective()
        {
            var town = SeedSimulationTown();
            var simulation = await NewService(town.Alive).SaveSimulationAsync(town.TownId, NewSimulation(10));
            await NewService(town.Alive).DeletePlanAsync(town.TownId, (await SimulationPlansAsync(town.TownId, town.Alive, simulation.Id)).Single().Id);

            var created = await NewService(town.Alive).SavePlanAsync(town.TownId,
                new NightwatchPlanRequestDto { Day = 10, Name = "Recréée", SimulationId = simulation.Id, Content = new NightwatchPlanContentDto() });

            created.SimulationId.Should().Be(simulation.Id);
            created.IsEffective.Should().BeFalse();
        }

        [Fact]
        public async Task DeleteSimulation_DetachesEffectiveDeletesOthers()
        {
            var town = SeedSimulationTown();
            var simulation = await NewService(town.Alive).SaveSimulationAsync(town.TownId, NewSimulation(11));
            var plans = await SimulationPlansAsync(town.TownId, town.Alive, simulation.Id);
            var effective = plans.Single(plan => plan.Day == 10);
            var other = plans.Single(plan => plan.Day == 11);
            await NewService(town.Alive).SetEffectiveAsync(town.TownId, effective.Id);

            await NewService(town.Alive).DeleteSimulationAsync(town.TownId, simulation.Id);

            var result = await NewService(town.Alive).GetPlansAsync(town.TownId);
            result.Simulations.Should().NotContain(row => row.Id == simulation.Id);
            result.Plans.Should().NotContain(plan => plan.Id == other.Id);
            var kept = result.Plans.Single(plan => plan.Id == effective.Id);
            kept.SimulationId.Should().BeNull();
            kept.IsEffective.Should().BeTrue();
        }

        [Fact]
        public async Task DuplicateSimulation_CopiesFutureDaysContent()
        {
            var town = SeedSimulationTown();
            var simulation = await NewService(town.Alive).SaveSimulationAsync(town.TownId, NewSimulation(11));
            var day11 = (await SimulationPlansAsync(town.TownId, town.Alive, simulation.Id)).Single(plan => plan.Day == 11);
            await NewService(town.Alive).SavePlanAsync(town.TownId, new NightwatchPlanRequestDto
            {
                Id = day11.Id, Version = day11.Version, Day = 11, Name = day11.Name,
                Content = new NightwatchPlanContentDto { GlobalItems = new Dictionary<int, int> { [5] = 2 } }
            });
            await NewService(town.Alive).SetEffectiveAsync(town.TownId, day11.Id);

            var copy = await NewService(town.Alive).DuplicateSimulationAsync(town.TownId, simulation.Id, "Copie");

            var copies = await SimulationPlansAsync(town.TownId, town.Alive, copy.Id);
            copy.Id.Should().NotBe(simulation.Id);
            copy.Name.Should().Be("Copie");
            copy.LastDay.Should().Be(11);
            copy.Stock.Should().Equal(simulation.Stock);
            copies.Select(plan => plan.Day).Should().Equal(10, 11);
            copies.Should().OnlyContain(plan => !plan.IsEffective);
            copies.Single(plan => plan.Day == 11).Content.GlobalItems.Should().Equal(new Dictionary<int, int> { [5] = 2 });
        }

        [Fact]
        public async Task GetPlans_ReturnsSimulationsAndLinks()
        {
            var town = SeedSimulationTown();
            var simulation = await NewService(town.Alive).SaveSimulationAsync(town.TownId, NewSimulation(10));
            var loose = await NewService(town.Alive).SavePlanAsync(town.TownId, NewRequest(10, "Hors simulation"));

            var result = await NewService(town.Alive).GetPlansAsync(town.TownId);

            result.Simulations.Should().ContainSingle(row => row.Id == simulation.Id && row.Name == "Simu" && row.LastDay == 10);
            result.Plans.Single(plan => plan.Id == loose.Id).SimulationId.Should().BeNull();
            result.Plans.Should().ContainSingle(plan => plan.SimulationId == simulation.Id);
        }

        [Fact]
        public async Task SimulationPastDays_StayReadable_FutureEditable()
        {
            var town = SeedSimulationTown();
            var simulation = await NewService(town.Alive).SaveSimulationAsync(town.TownId, NewSimulation(13));
            using (var context = NewContext())
            {
                context.Towns.Single(row => row.IdTown == town.TownId).Day = 12;
                context.SaveChanges();
            }

            var plans = await SimulationPlansAsync(town.TownId, town.Alive, simulation.Id);
            var day13 = plans.Single(plan => plan.Day == 13);
            var saved = await NewService(town.Alive).SavePlanAsync(town.TownId, new NightwatchPlanRequestDto
            {
                Id = day13.Id, Version = day13.Version, Day = 13, Name = "Modifiée", Content = day13.Content
            });

            plans.Select(plan => plan.Day).Should().Equal(10, 11, 12, 13);
            saved.Name.Should().Be("Modifiée");
            saved.SimulationId.Should().Be(simulation.Id);
        }
    }
}
