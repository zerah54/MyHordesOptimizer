using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Hubs;
using MyHordesOptimizerApi.Services.Impl.BuildingPlans;
using MyHordesOptimizerApiUnitTests.Expeditions.Fakes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApiUnitTests.BuildingPlans
{
    public class BuildingPlansHubTests
    {
        private sealed class ManualTimeProvider : TimeProvider
        {
            private DateTimeOffset _now = new(2026, 11, 3, 12, 0, 0, TimeSpan.Zero);
            public override DateTimeOffset GetUtcNow() => _now;
            public void Advance(TimeSpan span) => _now += span;
        }

        private sealed class FakeHubContext : IHubContext<BuildingPlansHub>
        {
            public FakeHubCallerClients FakeClients { get; } = new();
            public string? FailingGroup { get; set; }
            public IHubClients Clients => new HubClients(FakeClients, FailingGroup);
            public IGroupManager Groups { get; } = new FakeGroupManager();
        }

        private sealed class ThrowingProxy : IClientProxy
        {
            public Task SendCoreAsync(string method, object?[] args, System.Threading.CancellationToken cancellationToken = default)
                => throw new InvalidOperationException("boom");
        }

        private sealed class HubClients : IHubClients
        {
            private readonly FakeHubCallerClients _inner;
            private readonly string? _failingGroup;
            public HubClients(FakeHubCallerClients inner, string? failingGroup = null)
            {
                _inner = inner;
                _failingGroup = failingGroup;
            }
            public IClientProxy All => _inner.All;
            public IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => _inner.AllExcept(excludedConnectionIds);
            public IClientProxy Client(string connectionId) => _inner.Client(connectionId);
            public IClientProxy Clients(IReadOnlyList<string> connectionIds) => _inner.Clients(connectionIds);
            public IClientProxy Group(string groupName) => groupName == _failingGroup ? new ThrowingProxy() : _inner.Group(groupName);
            public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => _inner.GroupExcept(groupName, excludedConnectionIds);
            public IClientProxy Groups(IReadOnlyList<string> groupNames) => _inner.Groups(groupNames);
            public IClientProxy User(string userId) => _inner.User(userId);
            public IClientProxy Users(IReadOnlyList<string> userIds) => _inner.Users(userIds);
        }

        private static BuildingPlansHub NewHub(BuildingPlanLockRegistry registry, int userId, int townId, string connectionId,
            FakeTownAccessService? townAccessService = null, FakeHubCallerClients? clients = null)
        {
            return new BuildingPlansHub(
                registry,
                townAccessService ?? new FakeTownAccessService(),
                new FakeUserInfoProvider { UserId = userId, TownDetail = new SimpleMeTownDetailDto { TownId = townId } },
                NullLogger<AbstractMyHordesOptimizerControllerBase>.Instance)
            {
                Context = new FakeHubCallerContext(connectionId),
                Clients = clients ?? new FakeHubCallerClients(),
                Groups = new FakeGroupManager()
            };
        }

        private static BuildingPlanLockRegistry NewRegistry() => new(new ManualTimeProvider());

        [Fact]
        public async Task AcquirePlanLock_Accorde_DiffusePlanLockChangedAuGroupeDeLaVille()
        {
            var clients = new FakeHubCallerClients();
            var hub = NewHub(NewRegistry(), userId: 5, townId: 42, connectionId: "c1", clients: clients);

            var result = await hub.AcquirePlanLock(9);

            result.PlanId.Should().Be(9);
            result.HolderUserId.Should().Be(5);
            result.HolderConnectionId.Should().Be("c1");
            clients.Proxy.Sent.Select(s => s.Method).Should().Equal("PlanLockChanged");
            clients.Proxy.Sent[0].Args[0].Should().BeEquivalentTo(result);
        }

        [Fact]
        public async Task AcquirePlanLock_DejaTenuParUneAutreConnexion_RenvoieLeDetenteurSansDiffuser()
        {
            var registry = NewRegistry();
            await NewHub(registry, userId: 5, townId: 42, connectionId: "c1").AcquirePlanLock(9);
            var clients = new FakeHubCallerClients();
            var hub = NewHub(registry, userId: 6, townId: 42, connectionId: "c2", clients: clients);

            var result = await hub.AcquirePlanLock(9);

            result.HolderUserId.Should().Be(5);
            result.HolderConnectionId.Should().Be("c1");
            clients.Proxy.Sent.Should().BeEmpty();
        }

        [Fact]
        public async Task TakePlanLock_DiffuseLeNouveauDetenteur()
        {
            var registry = NewRegistry();
            await NewHub(registry, userId: 5, townId: 42, connectionId: "c1").AcquirePlanLock(9);
            var clients = new FakeHubCallerClients();
            var hub = NewHub(registry, userId: 6, townId: 42, connectionId: "c2", clients: clients);

            var result = await hub.TakePlanLock(9);

            result.HolderUserId.Should().Be(6);
            result.HolderConnectionId.Should().Be("c2");
            clients.Proxy.Sent.Select(s => s.Method).Should().Equal("PlanLockChanged");
            clients.Proxy.Sent[0].Args[0].Should().BeEquivalentTo(result);
        }

        [Fact]
        public async Task OnDisconnectedAsync_LibereLesVerrousDeLaConnexionEtLeDiffuse()
        {
            var registry = NewRegistry();
            var clients = new FakeHubCallerClients();
            var hub = NewHub(registry, userId: 5, townId: 42, connectionId: "c1", clients: clients);
            await hub.AcquirePlanLock(1);
            await hub.AcquirePlanLock(2);
            clients.Proxy.Sent.Clear();

            await hub.OnDisconnectedAsync(null);

            registry.HolderOf(new PlanLockKey(42, 1)).Should().BeNull();
            registry.HolderOf(new PlanLockKey(42, 2)).Should().BeNull();
            clients.Proxy.Sent.Select(s => s.Method).Should().Equal("PlanLockChanged", "PlanLockChanged");
            clients.Proxy.Sent.Select(s => ((PlanLockDto)s.Args[0]!).HolderUserId).Should().OnlyContain(h => h == null);
        }

        [Fact]
        public async Task AcquirePlanLock_SansDroitDEcriture_Leve()
        {
            var registry = NewRegistry();
            var hub = NewHub(registry, userId: 5, townId: 42, connectionId: "c1", townAccessService: new FakeTownAccessService { Allow = false });

            var act = () => hub.AcquirePlanLock(9);

            await act.Should().ThrowAsync<MhoForbiddenException>();
            registry.HolderOf(new PlanLockKey(42, 9)).Should().BeNull();
        }

        [Fact]
        public async Task GetPlanLocks_RenvoieLesVerrousDeLaVilleSansDiffuser()
        {
            var registry = NewRegistry();
            registry.TryAcquire(new PlanLockKey(42, 9), new PlanLockHolder("c2", 7));
            registry.TryAcquire(new PlanLockKey(43, 3), new PlanLockHolder("c3", 8));
            var clients = new FakeHubCallerClients();
            var hub = NewHub(registry, userId: 5, townId: 42, connectionId: "c1", clients: clients);

            var result = await hub.GetPlanLocks();

            result.Should().BeEquivalentTo(new[] { new PlanLockDto { PlanId = 9, HolderUserId = 7, HolderConnectionId = "c2" } });
            clients.Proxy.Sent.Should().BeEmpty();
        }

        [Fact]
        public async Task GetPlanLocks_SansVille_Leve()
        {
            var hub = NewHub(NewRegistry(), userId: 5, townId: 0, connectionId: "c1");

            var act = () => hub.GetPlanLocks();

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task AcquirePlanLock_SansVille_LeveSansRienAcquerirNiDiffuser()
        {
            var registry = NewRegistry();
            var clients = new FakeHubCallerClients();
            var hub = NewHub(registry, userId: 5, townId: 0, connectionId: "c1", clients: clients);

            var act = () => hub.AcquirePlanLock(9);

            await act.Should().ThrowAsync<MhoForbiddenException>();
            registry.HolderOf(new PlanLockKey(0, 9)).Should().BeNull();
            clients.Proxy.Sent.Should().BeEmpty();
        }

        [Fact]
        public async Task TakePlanLock_EtReleasePlanLock_SansVille_Levent()
        {
            var hub = NewHub(NewRegistry(), userId: 5, townId: 0, connectionId: "c1");

            await ((Func<Task>)(() => hub.TakePlanLock(9))).Should().ThrowAsync<MhoForbiddenException>();
            await ((Func<Task>)(() => hub.ReleasePlanLock(9))).Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task Sweeper_UneDiffusionEnEchec_NEmpecheLesAutres()
        {
            var time = new ManualTimeProvider();
            var registry = new BuildingPlanLockRegistry(time);
            registry.TryAcquire(new PlanLockKey(1, 1), new PlanLockHolder("c1", 5));
            registry.TryAcquire(new PlanLockKey(2, 2), new PlanLockHolder("c2", 6));
            time.Advance(BuildingPlanLockRegistry.IdleTimeout + TimeSpan.FromSeconds(1));
            var hubContext = new FakeHubContext { FailingGroup = "1" };
            var sweeper = new BuildingPlanLockSweeper(hubContext, registry, NullLogger<BuildingPlanLockSweeper>.Instance);

            await sweeper.SweepOnceAsync();

            hubContext.FakeClients.Proxy.Sent.Select(s => ((PlanLockDto)s.Args[0]!).PlanId).Should().Equal(2);
        }

        [Fact]
        public async Task NotifyTaskChecks_DiffuseAuxAutresMaisPasALAppelant()
        {
            var clients = new FakeHubCallerClients();
            var hub = NewHub(NewRegistry(), userId: 5, townId: 42, connectionId: "c1", clients: clients);

            await hub.NotifyTaskChecks(5);

            clients.OthersInGroupTargets.Should().Equal("42");
            clients.Proxy.Sent.Select(s => s.Method).Should().Equal("TaskChecksChanged");
            clients.Proxy.Sent[0].Args[0].Should().Be(5);
        }

        [Fact]
        public void Sweeper_PasseToutesLesCinqSecondes()
        {
            BuildingPlanLockSweeper.Period.Should().Be(TimeSpan.FromSeconds(5));
        }

        [Fact]
        public async Task Sweeper_ExpireEtDiffuseLesVerrousInactifs()
        {
            var time = new ManualTimeProvider();
            var registry = new BuildingPlanLockRegistry(time);
            registry.TryAcquire(new PlanLockKey(42, 9), new PlanLockHolder("c1", 5));
            time.Advance(BuildingPlanLockRegistry.IdleTimeout + TimeSpan.FromSeconds(1));
            var hubContext = new FakeHubContext();
            var sweeper = new BuildingPlanLockSweeper(hubContext, registry, NullLogger<BuildingPlanLockSweeper>.Instance);

            await sweeper.SweepOnceAsync();

            hubContext.FakeClients.Proxy.Sent.Select(s => s.Method).Should().Equal("PlanLockChanged");
            var dto = (PlanLockDto)hubContext.FakeClients.Proxy.Sent[0].Args[0]!;
            dto.PlanId.Should().Be(9);
            dto.HolderUserId.Should().BeNull();
        }
    }
}
