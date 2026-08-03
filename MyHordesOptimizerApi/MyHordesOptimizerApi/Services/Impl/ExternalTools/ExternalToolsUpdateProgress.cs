using MyHordesOptimizerApi.Models.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.ExternalTools
{
    /// <summary>
    /// État d'un lancement de mise à jour des outils externes, et agrégation des unités de travail
    /// vers l'outil qu'elles alimentent. Un outil passe au vert quand toutes ses unités sont
    /// passées, et au rouge dès la première erreur — les unités restantes continuent, leurs erreurs
    /// s'ajoutent.
    /// Toutes les mutations et la lecture sont sous le même verrou : les unités s'exécutent dans des
    /// tâches parallèles pendant que le client interroge l'état.
    /// </summary>
    public class ExternalToolsUpdateProgress : IExternalToolsProgressSink
    {
        private sealed class ToolProgress
        {
            public int PendingUnits { get; set; }
            public List<ExternalToolUpdateError> Errors { get; } = new();
        }

        private readonly object _lock = new();
        private readonly Dictionary<ExternalToolId, ToolProgress> _tools = new();
        private bool _isRunning = true;
        private DateTime? _finishedAt;

        public ExternalToolsUpdateProgress(DateTime startedAt)
        {
            JobId = Guid.NewGuid();
            StartedAt = startedAt;
        }

        public Guid JobId { get; }

        public DateTime StartedAt { get; }

        public bool IsRunning
        {
            get
            {
                lock (_lock)
                {
                    return _isRunning;
                }
            }
        }

        public DateTime? FinishedAt
        {
            get
            {
                lock (_lock)
                {
                    return _finishedAt;
                }
            }
        }

        public void Declare(ExternalToolId tool, string unit)
        {
            lock (_lock)
            {
                if (!_tools.TryGetValue(tool, out var progress))
                {
                    progress = new ToolProgress();
                    _tools[tool] = progress;
                }
                progress.PendingUnits++;
            }
        }

        public void Succeeded(ExternalToolId tool, string unit)
        {
            lock (_lock)
            {
                if (_tools.TryGetValue(tool, out var progress) && progress.PendingUnits > 0)
                {
                    progress.PendingUnits--;
                }
            }
        }

        public void Failed(ExternalToolId tool, string unit, string message)
        {
            lock (_lock)
            {
                if (!_tools.TryGetValue(tool, out var progress))
                {
                    return;
                }
                if (progress.PendingUnits > 0)
                {
                    progress.PendingUnits--;
                }
                progress.Errors.Add(new ExternalToolUpdateError { Unit = unit, Message = message });
            }
        }

        public void AddError(ExternalToolId tool, string unit, string message)
        {
            lock (_lock)
            {
                if (!_tools.TryGetValue(tool, out var progress))
                {
                    return;
                }
                progress.Errors.Add(new ExternalToolUpdateError { Unit = unit, Message = message });
            }
        }

        public void FailAllPending(string unit, string message, ExternalToolId? onlyTool = null)
        {
            lock (_lock)
            {
                foreach (var entry in _tools)
                {
                    if (onlyTool.HasValue && entry.Key != onlyTool.Value)
                    {
                        continue;
                    }
                    if (entry.Value.PendingUnits <= 0)
                    {
                        continue;
                    }
                    entry.Value.PendingUnits = 0;
                    entry.Value.Errors.Add(new ExternalToolUpdateError { Unit = unit, Message = message });
                }
            }
        }

        public void Complete(DateTime finishedAt)
        {
            lock (_lock)
            {
                _isRunning = false;
                _finishedAt = finishedAt;
            }
        }

        public ExternalToolsUpdateJobState Snapshot()
        {
            lock (_lock)
            {
                return new ExternalToolsUpdateJobState
                {
                    JobId = JobId,
                    IsRunning = _isRunning,
                    StartedAt = StartedAt,
                    FinishedAt = _finishedAt,
                    Tools = _tools.Select(entry => new ExternalToolUpdateState
                    {
                        Tool = entry.Key.ToContractId(),
                        Status = StatusOf(entry.Value).ToContractId(),
                        Errors = entry.Value.Errors
                            .Select(error => new ExternalToolUpdateError { Unit = error.Unit, Message = error.Message })
                            .ToList()
                    }).ToList()
                };
            }
        }

        private static ExternalToolUpdateStatus StatusOf(ToolProgress progress)
        {
            if (progress.Errors.Count > 0)
            {
                return ExternalToolUpdateStatus.Error;
            }
            return progress.PendingUnits > 0 ? ExternalToolUpdateStatus.Pending : ExternalToolUpdateStatus.Success;
        }
    }
}
