using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Hubs;
using MyHordesOptimizerApi.Services.Impl.Expeditions;
using MyHordesOptimizerApi.Services.Impl.Locks;
using MyHordesOptimizerApiUnitTests.Expeditions.Fakes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApiUnitTests.Expeditions
{
    public class ExpeditionLockSweeperTests
    {
        private sealed class ManualTimeProvider : TimeProvider
        {
            private DateTimeOffset _now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);
            public override DateTimeOffset GetUtcNow() => _now;
            public void Advance(TimeSpan span) => _now += span;
        }

        private sealed class FakeHubContext : IHubContext<ExpeditionsHub>
        {
            public FakeHubCallerClients FakeClients { get; } = new();
            public RecordingHubClients RecordingClients { get; }
            public IHubClients Clients => RecordingClients;
            public IGroupManager Groups { get; } = new FakeGroupManager();
            public FakeHubContext() => RecordingClients = new RecordingHubClients(FakeClients);
        }

        private sealed class RecordingHubClients : IHubClients
        {
            private readonly FakeHubCallerClients _inner;
            public List<string> GroupTargets { get; } = new();
            public RecordingHubClients(FakeHubCallerClients inner) => _inner = inner;
            public IClientProxy All => _inner.All;
            public IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => _inner.AllExcept(excludedConnectionIds);
            public IClientProxy Client(string connectionId) => _inner.Client(connectionId);
            public IClientProxy Clients(IReadOnlyList<string> connectionIds) => _inner.Clients(connectionIds);
            public IClientProxy Group(string groupName)
            {
                GroupTargets.Add(groupName);
                return _inner.Group(groupName);
            }
            public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => _inner.GroupExcept(groupName, excludedConnectionIds);
            public IClientProxy Groups(IReadOnlyList<string> groupNames) => _inner.Groups(groupNames);
            public IClientProxy User(string userId) => _inner.User(userId);
            public IClientProxy Users(IReadOnlyList<string> userIds) => _inner.Users(userIds);
        }

        [Fact]
        public async Task SweepOnceAsync_VerrouInactif_DiffuseLaLiberationAuGroupeDeLaVille()
        {
            var time = new ManualTimeProvider();
            var registry = new ExpeditionLockRegistry(time);
            registry.TryAcquire(new ExpeditionLockKey(42, ExpeditionLockKind.Citizen, 7), new LockHolder("c1", 5));
            time.Advance(TimeSpan.FromSeconds(31));
            var hubContext = new FakeHubContext();
            var sweeper = new ExpeditionLockSweeper(hubContext, registry, NullLogger<ExpeditionLockSweeper>.Instance);

            await sweeper.SweepOnceAsync();

            hubContext.RecordingClients.GroupTargets.Should().Equal("42");
            hubContext.FakeClients.Proxy.Sent.Select(s => s.Method).Should().Equal("ExpeditionLockChanged");
            var dto = (ExpeditionLockDto)hubContext.FakeClients.Proxy.Sent[0].Args[0]!;
            dto.Kind.Should().Be("citizen");
            dto.EntityId.Should().Be(7);
            dto.HolderUserId.Should().BeNull();
        }

        [Fact]
        public void KindName_ReprendLesNomsKebabDuClient()
        {
            Enum.GetValues<ExpeditionLockKind>().Select(ExpeditionLockDto.KindName).Should()
                .Equal("expedition", "part", "citizen", "bag", "part-orders", "citizen-orders");
        }
    }
}
