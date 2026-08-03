using MyHordesOptimizerApi.Models.ExternalTools;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.ExternalTools
{
    /// <summary>
    /// Registre des mises à jour d'outils externes, une par joueur. L'horloge est injectable pour
    /// que la péremption et la purge soient testables sans attendre.
    /// </summary>
    public class ExternalToolsUpdateJobStore
    {
        /// <summary>
        /// Au-delà, un lancement encore « en cours » est tenu pour bloqué et n'interdit plus d'en
        /// lancer un nouveau. Sans cela, une unité coincée sur un appel sortant sans délai
        /// d'expiration priverait le joueur de toute mise à jour jusqu'au redémarrage de l'API.
        /// Quand <see cref="TryReserve"/> remplace ainsi un lancement périmé mais toujours en cours,
        /// l'ancien job orphelin continue d'écrire en base en tâche de fond : aucun verrou de ville
        /// n'est pris ici (contrairement à <c>TownSyncLock</c> utilisé ailleurs), donc ses écritures
        /// peuvent chevaucher celles du nouveau lancement sur la même ville. Risque faible (il faut
        /// qu'un lancement dépasse 5 minutes) mais réel de deux transactions concurrentes.
        /// </summary>
        public static readonly TimeSpan StaleAfter = TimeSpan.FromMinutes(5);

        /// <summary>Durée pendant laquelle l'issue d'un lancement terminé reste consultable.</summary>
        public static readonly TimeSpan RetainFinishedFor = TimeSpan.FromMinutes(10);

        private readonly object _lock = new();
        private readonly Dictionary<int, ExternalToolsUpdateProgress> _progressByUser = new();
        private readonly Func<DateTime> _now;

        public ExternalToolsUpdateJobStore() : this(() => DateTime.UtcNow)
        {
        }

        public ExternalToolsUpdateJobStore(Func<DateTime> now)
        {
            _now = now;
        }

        /// <summary>
        /// Réserve un lancement pour ce joueur, ou retourne null si l'un des siens tourne déjà.
        /// </summary>
        public ExternalToolsUpdateProgress? TryReserve(int userId)
        {
            lock (_lock)
            {
                PurgeExpired();
                var now = _now();
                if (_progressByUser.TryGetValue(userId, out var current)
                    && current.IsRunning
                    && now - current.StartedAt < StaleAfter)
                {
                    return null;
                }
                var progress = new ExternalToolsUpdateProgress(now);
                _progressByUser[userId] = progress;
                return progress;
            }
        }

        /// <summary>
        /// État du dernier lancement connu de ce joueur. Un joueur inconnu obtient un état vide
        /// (JobId à Guid.Empty) plutôt qu'un 404 : le client distingue ainsi « ce n'est pas mon
        /// lancement » d'une fin de traitement.
        /// </summary>
        public ExternalToolsUpdateJobState GetState(int userId)
        {
            lock (_lock)
            {
                PurgeExpired();
                return _progressByUser.TryGetValue(userId, out var progress)
                    ? progress.Snapshot()
                    : new ExternalToolsUpdateJobState();
            }
        }

        private void PurgeExpired()
        {
            var now = _now();
            var expired = _progressByUser
                .Where(entry => !entry.Value.IsRunning
                                && entry.Value.FinishedAt.HasValue
                                && now - entry.Value.FinishedAt.Value > RetainFinishedFor)
                .Select(entry => entry.Key)
                .ToList();
            foreach (var userId in expired)
            {
                _progressByUser.Remove(userId);
            }
        }
    }
}
