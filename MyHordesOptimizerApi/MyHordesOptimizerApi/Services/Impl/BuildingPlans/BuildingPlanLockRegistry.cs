using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.BuildingPlans
{
    /// <summary>Verrou d'une proposition de plan ; la ville fait partie de la clé.</summary>
    public sealed record PlanLockKey(int MapId, int PlanId);

    public sealed record PlanLockHolder(string ConnectionId, int UserId);

    /// <summary>
    /// Verrous en mémoire des propositions de plan, un détenteur (connexion SignalR) par proposition.
    /// Un verrou sans activité depuis <see cref="IdleTimeout"/> est considéré libre.
    /// </summary>
    public sealed class BuildingPlanLockRegistry
    {
        public static readonly TimeSpan IdleTimeout = TimeSpan.FromSeconds(30);

        private readonly TimeProvider _timeProvider;
        private readonly object _gate = new();
        private readonly Dictionary<PlanLockKey, (PlanLockHolder Holder, DateTimeOffset LastActivity)> _locks = new();

        public BuildingPlanLockRegistry(TimeProvider timeProvider)
        {
            _timeProvider = timeProvider;
        }

        /// <summary>Renvoie null si accordé (libre, déjà à lui, ou détenteur inactif), sinon le détenteur actuel.</summary>
        public PlanLockHolder? TryAcquire(PlanLockKey key, PlanLockHolder candidate)
        {
            lock (_gate)
            {
                var current = ActiveHolder(key);
                if (current is not null && current.ConnectionId != candidate.ConnectionId)
                {
                    return current;
                }
                _locks[key] = (candidate, _timeProvider.GetUtcNow());
                return null;
            }
        }

        /// <summary>Accorde toujours ; renvoie l'ancien détenteur s'il était une autre connexion.</summary>
        public PlanLockHolder? TakeOver(PlanLockKey key, PlanLockHolder candidate)
        {
            lock (_gate)
            {
                var previous = ActiveHolder(key);
                _locks[key] = (candidate, _timeProvider.GetUtcNow());
                return previous is not null && previous.ConnectionId != candidate.ConnectionId ? previous : null;
            }
        }

        public bool IsHeldBy(PlanLockKey key, string connectionId)
        {
            lock (_gate)
            {
                return ActiveHolder(key)?.ConnectionId == connectionId;
            }
        }

        public PlanLockHolder? HolderOf(PlanLockKey key)
        {
            lock (_gate)
            {
                return ActiveHolder(key);
            }
        }

        /// <summary>Verrous actifs de la ville demandée.</summary>
        public IReadOnlyList<(PlanLockKey Key, PlanLockHolder Holder)> ActiveHoldersOf(int mapId)
        {
            lock (_gate)
            {
                return _locks.Keys
                    .Where(k => k.MapId == mapId)
                    .Select(k => (Key: k, Holder: ActiveHolder(k)))
                    .Where(p => p.Holder is not null)
                    .Select(p => (p.Key, p.Holder!))
                    .ToList();
            }
        }

        /// <summary>Remet le compteur d'inactivité à zéro si la connexion détient le verrou.</summary>
        public void Touch(PlanLockKey key, string connectionId)
        {
            lock (_gate)
            {
                if (ActiveHolder(key)?.ConnectionId == connectionId)
                {
                    _locks[key] = (_locks[key].Holder, _timeProvider.GetUtcNow());
                }
            }
        }

        public bool Release(PlanLockKey key, string connectionId)
        {
            lock (_gate)
            {
                return _locks.TryGetValue(key, out var entry) && entry.Holder.ConnectionId == connectionId && _locks.Remove(key);
            }
        }

        public IReadOnlyList<PlanLockKey> ReleaseAll(string connectionId)
        {
            lock (_gate)
            {
                return Remove(e => e.Holder.ConnectionId == connectionId);
            }
        }

        /// <summary>Retire et renvoie les verrous inactifs depuis plus de <see cref="IdleTimeout"/>.</summary>
        public IReadOnlyList<PlanLockKey> ExpireIdle()
        {
            lock (_gate)
            {
                var limit = _timeProvider.GetUtcNow() - IdleTimeout;
                return Remove(e => e.LastActivity <= limit);
            }
        }

        private PlanLockHolder? ActiveHolder(PlanLockKey key)
        {
            return _locks.TryGetValue(key, out var entry) && entry.LastActivity > _timeProvider.GetUtcNow() - IdleTimeout
                ? entry.Holder
                : null;
        }

        private List<PlanLockKey> Remove(Func<(PlanLockHolder Holder, DateTimeOffset LastActivity), bool> predicate)
        {
            var keys = _locks.Where(p => predicate(p.Value)).Select(p => p.Key).ToList();
            keys.ForEach(k => _locks.Remove(k));
            return keys;
        }
    }
}
