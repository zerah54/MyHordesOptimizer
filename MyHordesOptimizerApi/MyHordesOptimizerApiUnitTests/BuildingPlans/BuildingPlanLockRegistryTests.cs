using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.BuildingPlans;
using System;
using System.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.BuildingPlans
{
    public class BuildingPlanLockRegistryTests
    {
        private sealed class ManualTimeProvider : TimeProvider
        {
            private DateTimeOffset _now = new(2026, 11, 3, 12, 0, 0, TimeSpan.Zero);

            public override DateTimeOffset GetUtcNow() => _now;

            public void Advance(TimeSpan delta) => _now += delta;
        }

        private static readonly PlanLockKey Key = new(1, 10);
        private static readonly PlanLockHolder Alice = new("conn-a", 100);
        private static readonly PlanLockHolder Bob = new("conn-b", 200);

        private readonly ManualTimeProvider _time = new();
        private readonly BuildingPlanLockRegistry _registry;

        public BuildingPlanLockRegistryTests()
        {
            _registry = new BuildingPlanLockRegistry(_time);
        }

        [Fact]
        public void ActiveHoldersOf_NeRenvoieQueLesVerrousActifsDeLaVille()
        {
            var expired = new PlanLockKey(1, 11);
            var active = new PlanLockKey(1, 12);
            _registry.TryAcquire(expired, Alice);
            _registry.TryAcquire(new PlanLockKey(2, 13), Bob);
            _time.Advance(BuildingPlanLockRegistry.IdleTimeout + TimeSpan.FromSeconds(1));
            _registry.TryAcquire(active, Bob);

            var result = _registry.ActiveHoldersOf(1);

            result.Should().Equal((active, Bob));
        }

        [Fact]
        public void TryAcquire_SurVerrouLibre_AccordeEtRendIsHeldByVrai()
        {
            _registry.TryAcquire(Key, Alice).Should().BeNull();

            _registry.IsHeldBy(Key, Alice.ConnectionId).Should().BeTrue();
            _registry.HolderOf(Key).Should().Be(Alice);
        }

        [Fact]
        public void TryAcquire_SurVerrouDUneAutreConnexion_RefuseEtRenvoieLeDetenteur()
        {
            _registry.TryAcquire(Key, Alice);

            _registry.TryAcquire(Key, Bob).Should().Be(Alice);
            _registry.TryAcquire(Key, new PlanLockHolder("conn-a2", Alice.UserId)).Should().Be(Alice);
            _registry.IsHeldBy(Key, Alice.ConnectionId).Should().BeTrue();
        }

        [Fact]
        public void TryAcquire_ApresTroisMinutesSansTouch_Accorde()
        {
            _registry.TryAcquire(Key, Alice);
            _time.Advance(BuildingPlanLockRegistry.IdleTimeout + TimeSpan.FromSeconds(1));

            _registry.IsHeldBy(Key, Alice.ConnectionId).Should().BeFalse();
            _registry.TryAcquire(Key, Bob).Should().BeNull();
            _registry.HolderOf(Key).Should().Be(Bob);
        }

        [Fact]
        public void ATroisMinutesPile_LeVerrouEstExpire_CommeAuBalayage()
        {
            _registry.TryAcquire(Key, Alice);
            _time.Advance(BuildingPlanLockRegistry.IdleTimeout - TimeSpan.FromTicks(1));
            _registry.HolderOf(Key).Should().Be(Alice);
            _registry.ExpireIdle().Should().BeEmpty();

            _time.Advance(TimeSpan.FromTicks(1));

            _registry.HolderOf(Key).Should().BeNull();
            _registry.ExpireIdle().Should().ContainSingle().Which.Should().Be(Key);
        }

        [Fact]
        public void IdleTimeout_EstDeTrenteSecondes()
        {
            BuildingPlanLockRegistry.IdleTimeout.Should().Be(TimeSpan.FromSeconds(30));
        }

        [Fact]
        public void Touch_RepousseLExpiration()
        {
            var twoThirds = BuildingPlanLockRegistry.IdleTimeout * 2 / 3;
            _registry.TryAcquire(Key, Alice);
            _time.Advance(twoThirds);
            _registry.Touch(Key, Alice.ConnectionId);
            _time.Advance(twoThirds);

            _registry.IsHeldBy(Key, Alice.ConnectionId).Should().BeTrue();
            _registry.TryAcquire(Key, Bob).Should().Be(Alice);
        }

        [Fact]
        public void TakeOver_RenvoieLAncienDetenteurEtAccorde()
        {
            _registry.TryAcquire(Key, Alice);

            _registry.TakeOver(Key, Bob).Should().Be(Alice);

            _registry.IsHeldBy(Key, Bob.ConnectionId).Should().BeTrue();
            _registry.IsHeldBy(Key, Alice.ConnectionId).Should().BeFalse();
        }

        [Fact]
        public void ReleaseAll_RetireTousLesVerrousDeLaConnexionEtLesRenvoie()
        {
            var other = new PlanLockKey(1, 11);
            var bobs = new PlanLockKey(1, 12);
            _registry.TryAcquire(Key, Alice);
            _registry.TryAcquire(other, Alice);
            _registry.TryAcquire(bobs, Bob);

            var released = _registry.ReleaseAll(Alice.ConnectionId);

            released.Should().BeEquivalentTo(new[] { Key, other });
            _registry.HolderOf(Key).Should().BeNull();
            _registry.HolderOf(other).Should().BeNull();
            _registry.HolderOf(bobs).Should().Be(Bob);
        }

        [Fact]
        public void ExpireIdle_NeRenvoieQueLesVerrousInactifs()
        {
            var fresh = new PlanLockKey(1, 11);
            var twoThirds = BuildingPlanLockRegistry.IdleTimeout * 2 / 3;
            _registry.TryAcquire(Key, Alice);
            _time.Advance(twoThirds);
            _registry.TryAcquire(fresh, Bob);
            _time.Advance(BuildingPlanLockRegistry.IdleTimeout - twoThirds + TimeSpan.FromSeconds(1));

            var expired = _registry.ExpireIdle();

            expired.Should().ContainSingle().Which.Should().Be(Key);
            _registry.HolderOf(Key).Should().BeNull();
            _registry.HolderOf(fresh).Should().Be(Bob);
        }

        [Fact]
        public void Cles_DeVillesDifferentes_NeSeBloquentPas()
        {
            var otherTown = new PlanLockKey(2, Key.PlanId);
            _registry.TryAcquire(Key, Alice);

            _registry.TryAcquire(otherTown, Bob).Should().BeNull();
            _registry.HolderOf(Key).Should().Be(Alice);
            _registry.HolderOf(otherTown).Should().Be(Bob);
        }
    }
}
