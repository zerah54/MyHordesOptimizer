using MyHordesOptimizerApi.Models.ExternalTools;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.ExternalTools
{
    /// <summary>
    /// Registre des mises à jour d'outils externes, un lancement par JobId. Un même joueur peut avoir
    /// plusieurs lancements en cours (ex. deux cases mises à jour coup sur coup en avançant dans le
    /// désert, sans attendre la fin de la précédente) : rien en dessous ne l'interdit, l'écriture DB
    /// reste sérialisée par ville via <c>TownSyncLock</c>. L'horloge est injectable pour que la
    /// péremption et la purge soient testables sans attendre.
    /// </summary>
    public class ExternalToolsUpdateJobStore
    {
        /// <summary>
        /// Au-delà, un lancement encore « en cours » est tenu pour abandonné (tâche de fond plantée
        /// avant d'appeler Complete) et purgé du registre au lieu de s'y accumuler indéfiniment.
        /// </summary>
        public static readonly TimeSpan StaleAfter = TimeSpan.FromMinutes(5);

        /// <summary>Durée pendant laquelle l'issue d'un lancement terminé reste consultable.</summary>
        public static readonly TimeSpan RetainFinishedFor = TimeSpan.FromMinutes(10);

        private readonly object _lock = new();
        private readonly Dictionary<Guid, ExternalToolsUpdateProgress> _progressByJobId = new();
        private readonly Func<DateTime> _now;

        public ExternalToolsUpdateJobStore() : this(() => DateTime.UtcNow)
        {
        }

        public ExternalToolsUpdateJobStore(Func<DateTime> now)
        {
            _now = now;
        }

        /// <summary>
        /// Démarre un nouveau lancement pour ce joueur, toujours accepté : plusieurs lancements du
        /// même joueur peuvent tourner en parallèle, chacun suivi par son propre JobId.
        /// </summary>
        public ExternalToolsUpdateProgress Reserve(int userId)
        {
            lock (_lock)
            {
                PurgeExpired();
                var progress = new ExternalToolsUpdateProgress(userId, _now());
                _progressByJobId[progress.JobId] = progress;
                return progress;
            }
        }

        /// <summary>
        /// État d'un lancement précis. Un JobId inconnu, ou appartenant à un autre joueur, rend un
        /// état vide (JobId à Guid.Empty) : le client distingue ainsi « ce n'est pas mon lancement »
        /// d'une fin de traitement, et un joueur ne peut pas lire l'avancement d'un autre en devinant
        /// son JobId.
        /// </summary>
        public ExternalToolsUpdateJobState GetState(Guid jobId, int userId)
        {
            lock (_lock)
            {
                PurgeExpired();
                if (_progressByJobId.TryGetValue(jobId, out var progress) && progress.UserId == userId)
                {
                    return progress.Snapshot();
                }
                return new ExternalToolsUpdateJobState();
            }
        }

        private void PurgeExpired()
        {
            var now = _now();
            var expired = _progressByJobId
                .Where(entry => (!entry.Value.IsRunning && entry.Value.FinishedAt.HasValue && now - entry.Value.FinishedAt.Value > RetainFinishedFor)
                                || (entry.Value.IsRunning && now - entry.Value.StartedAt > StaleAfter))
                .Select(entry => entry.Key)
                .ToList();
            foreach (var jobId in expired)
            {
                _progressByJobId.Remove(jobId);
            }
        }
    }
}
