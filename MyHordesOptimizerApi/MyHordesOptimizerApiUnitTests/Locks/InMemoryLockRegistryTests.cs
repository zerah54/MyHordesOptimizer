using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.Locks;
using System;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Locks
{
    public class InMemoryLockRegistryTests
    {
        private sealed class ManualTimeProvider : TimeProvider
        {
            private DateTimeOffset _now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);

            public override DateTimeOffset GetUtcNow() => _now;

            public void Advance(TimeSpan delta) => _now += delta;
        }

        private static readonly LockHolder Alice = new("conn-a", 100);
        private static readonly LockHolder Bob = new("conn-b", 200);

        private readonly ManualTimeProvider _time = new();
        private readonly InMemoryLockRegistry<string> _registry;

        public InMemoryLockRegistryTests()
        {
            _registry = new InMemoryLockRegistry<string>(_time);
        }

        [Fact]
        public void TryAcquire_Libre_Accorde()
        {
            _registry.TryAcquire("k", Alice).Should().BeNull();
            _registry.HolderOf("k").Should().Be(Alice);
        }

        [Fact]
        public void TryAcquire_TenuParAutre_RenvoieLeDetenteur()
        {
            _registry.TryAcquire("k", Alice);

            _registry.TryAcquire("k", Bob).Should().Be(Alice);
        }

        [Fact]
        public void TryAcquire_DetenteurInactifDepuis30s_Accorde()
        {
            _registry.TryAcquire("k", Alice);
            _time.Advance(TimeSpan.FromSeconds(30));

            _registry.TryAcquire("k", Bob).Should().BeNull();
            _registry.HolderOf("k").Should().Be(Bob);
        }

        [Fact]
        public void Touch_RepousseLExpiration()
        {
            _registry.TryAcquire("k", Alice);
            _time.Advance(TimeSpan.FromSeconds(20));
            _registry.Touch("k", Alice.ConnectionId);
            _time.Advance(TimeSpan.FromSeconds(20));

            _registry.HolderOf("k").Should().Be(Alice);
        }

        [Fact]
        public void ActiveHolders_FiltreLesCles()
        {
            _registry.TryAcquire("a:1", Alice);
            _registry.TryAcquire("b:1", Bob);

            var result = _registry.ActiveHolders(k => k.StartsWith("a:"));

            result.Should().ContainSingle().Which.Should().Be(("a:1", Alice));
        }
    }
}
