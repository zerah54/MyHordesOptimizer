using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Locks
{
    public sealed record LockHolder(string ConnectionId, int UserId);

    /// <summary>
    /// Verrous en mémoire, un détenteur (connexion SignalR) par clé.
    /// Un verrou sans activité depuis <see cref="IdleTimeout"/> est considéré libre.
    /// </summary>
    public class InMemoryLockRegistry<TKey> where TKey : notnull
    {
        public static readonly TimeSpan IdleTimeout = TimeSpan.FromSeconds(30);

        private readonly TimeProvider _timeProvider;
        private readonly object _gate = new();
        private readonly Dictionary<TKey, (LockHolder Holder, DateTimeOffset LastActivity)> _locks = new();

        public InMemoryLockRegistry(TimeProvider timeProvider)
        {
            _timeProvider = timeProvider;
        }

        /// <summary>Renvoie null si accordé (libre, déjà à lui, ou détenteur inactif), sinon le détenteur actuel.</summary>
        public LockHolder? TryAcquire(TKey key, LockHolder candidate)
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
        public LockHolder? TakeOver(TKey key, LockHolder candidate)
        {
            lock (_gate)
            {
                var previous = ActiveHolder(key);
                _locks[key] = (candidate, _timeProvider.GetUtcNow());
                return previous is not null && previous.ConnectionId != candidate.ConnectionId ? previous : null;
            }
        }

        public bool IsHeldBy(TKey key, string connectionId)
        {
            lock (_gate)
            {
                return ActiveHolder(key)?.ConnectionId == connectionId;
            }
        }

        public LockHolder? HolderOf(TKey key)
        {
            lock (_gate)
            {
                return ActiveHolder(key);
            }
        }

        /// <summary>Verrous actifs dont la clé satisfait le filtre.</summary>
        public IReadOnlyList<(TKey Key, LockHolder Holder)> ActiveHolders(Func<TKey, bool> filter)
        {
            lock (_gate)
            {
                return _locks.Keys
                    .Where(filter)
                    .Select(k => (Key: k, Holder: ActiveHolder(k)))
                    .Where(p => p.Holder is not null)
                    .Select(p => (p.Key, p.Holder!))
                    .ToList();
            }
        }

        /// <summary>Remet le compteur d'inactivité à zéro si la connexion détient le verrou.</summary>
        public void Touch(TKey key, string connectionId)
        {
            lock (_gate)
            {
                if (ActiveHolder(key)?.ConnectionId == connectionId)
                {
                    _locks[key] = (_locks[key].Holder, _timeProvider.GetUtcNow());
                }
            }
        }

        public bool Release(TKey key, string connectionId)
        {
            lock (_gate)
            {
                return _locks.TryGetValue(key, out var entry) && entry.Holder.ConnectionId == connectionId && _locks.Remove(key);
            }
        }

        public IReadOnlyList<TKey> ReleaseAll(string connectionId)
        {
            lock (_gate)
            {
                return Remove(e => e.Holder.ConnectionId == connectionId);
            }
        }

        /// <summary>Retire et renvoie les verrous de la connexion dont la clé satisfait le prédicat (ex. ceux d'une ville quittée).</summary>
        public IReadOnlyList<TKey> ReleaseAll(string connectionId, Func<TKey, bool> keyPredicate)
        {
            lock (_gate)
            {
                var keys = _locks.Where(p => p.Value.Holder.ConnectionId == connectionId && keyPredicate(p.Key)).Select(p => p.Key).ToList();
                keys.ForEach(k => _locks.Remove(k));
                return keys;
            }
        }

        /// <summary>Retire et renvoie les verrous inactifs depuis plus de <see cref="IdleTimeout"/>.</summary>
        public IReadOnlyList<TKey> ExpireIdle()
        {
            lock (_gate)
            {
                var limit = _timeProvider.GetUtcNow() - IdleTimeout;
                return Remove(e => e.LastActivity <= limit);
            }
        }

        private LockHolder? ActiveHolder(TKey key)
        {
            return _locks.TryGetValue(key, out var entry) && entry.LastActivity > _timeProvider.GetUtcNow() - IdleTimeout
                ? entry.Holder
                : null;
        }

        private List<TKey> Remove(Func<(LockHolder Holder, DateTimeOffset LastActivity), bool> predicate)
        {
            var keys = _locks.Where(p => predicate(p.Value)).Select(p => p.Key).ToList();
            keys.ForEach(k => _locks.Remove(k));
            return keys;
        }
    }
}
