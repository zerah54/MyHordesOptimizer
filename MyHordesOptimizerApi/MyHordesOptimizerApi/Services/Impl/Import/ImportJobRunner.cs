using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Models.Import;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.Import
{
    /// <summary>
    /// Exécute les imports longs hors du cycle de vie d'une requête HTTP.
    /// Ces imports durent plusieurs minutes en production : les faire dans la requête la fait couper
    /// par le reverse proxy (504) alors que le traitement, lui, continue. Le client lance l'import puis
    /// interroge <see cref="GetState"/> pour en connaître l'avancement et l'issue.
    /// Singleton : l'état survit à la requête qui l'a déclenché.
    /// </summary>
    public class ImportJobRunner
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ImportJobRunner> _logger;
        private readonly object _lock = new();
        private readonly Dictionary<string, ImportJobState> _states = new();

        public ImportJobRunner(IServiceScopeFactory scopeFactory, ILogger<ImportJobRunner> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        /// <summary>
        /// Démarre un import en tâche de fond. Retourne false si ce même import est déjà en cours.
        /// Le contexte utilisateur est capturé ici : le scope de fond n'ayant aucune requête HTTP,
        /// la userkey nécessaire aux appels à l'API MyHordes doit lui être transmise explicitement.
        /// </summary>
        public bool TryStart(string jobKey,
            int userId,
            string userKey,
            string userName,
            Func<IMyHordesImportService, Action<ImportStepProgress>, Task> work)
        {
            lock (_lock)
            {
                if (_states.TryGetValue(jobKey, out var currentState) && currentState.IsRunning)
                {
                    return false;
                }
                _states[jobKey] = new ImportJobState
                {
                    Job = jobKey,
                    IsRunning = true,
                    StartedAt = DateTime.UtcNow
                };
            }
            _ = Task.Run(() => RunAsync(jobKey, userId, userKey, userName, work));
            return true;
        }

        public ImportJobState GetState(string jobKey)
        {
            lock (_lock)
            {
                return _states.TryGetValue(jobKey, out var state)
                    ? state.Clone()
                    : new ImportJobState { Job = jobKey };
            }
        }

        private async Task RunAsync(string jobKey,
            int userId,
            string userKey,
            string userName,
            Func<IMyHordesImportService, Action<ImportStepProgress>, Task> work)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();

                var userInfoProvider = scope.ServiceProvider.GetRequiredService<IUserInfoProvider>();
                userInfoProvider.UserId = userId;
                userInfoProvider.UserKey = userKey;
                userInfoProvider.UserName = userName;

                var importService = scope.ServiceProvider.GetRequiredService<IMyHordesImportService>();
                await work(importService, progress => OnStep(jobKey, progress));

                lock (_lock)
                {
                    var state = _states[jobKey];
                    state.IsRunning = false;
                    state.CurrentStep = null;
                    state.FinishedAt = DateTime.UtcNow;
                    state.LastRunSucceeded = true;
                }
                _logger.LogInformation("Import {Job} terminé avec succès", jobKey);
            }
            catch (Exception e)
            {
                string failedStep;
                lock (_lock)
                {
                    var state = _states[jobKey];
                    state.IsRunning = false;
                    state.FinishedAt = DateTime.UtcNow;
                    state.LastRunSucceeded = false;
                    state.Error = e.Message;
                    failedStep = state.CurrentStep;
                }
                _logger.LogError(e, "Échec de l'import {Job} à l'étape {Step}", jobKey, failedStep);
            }
        }

        private void OnStep(string jobKey, ImportStepProgress progress)
        {
            lock (_lock)
            {
                var state = _states[jobKey];
                state.CurrentStep = progress.Key;
                state.CurrentStepIndex = progress.Index;
                state.TotalSteps = progress.Total;
            }
        }
    }
}