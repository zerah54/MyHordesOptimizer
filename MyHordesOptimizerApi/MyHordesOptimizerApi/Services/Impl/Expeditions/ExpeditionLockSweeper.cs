using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Hubs;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.Expeditions
{
    /// <summary>Libère périodiquement les verrous de blocs inactifs et en informe les villes concernées.</summary>
    public sealed class ExpeditionLockSweeper : BackgroundService
    {
        public static readonly TimeSpan Period = TimeSpan.FromSeconds(5);

        private readonly IHubContext<ExpeditionsHub> _hubContext;
        private readonly ExpeditionLockRegistry _registry;
        private readonly ILogger<ExpeditionLockSweeper> _logger;

        public ExpeditionLockSweeper(IHubContext<ExpeditionsHub> hubContext, ExpeditionLockRegistry registry, ILogger<ExpeditionLockSweeper> logger)
        {
            _hubContext = hubContext;
            _registry = registry;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using var timer = new PeriodicTimer(Period);
            try
            {
                while (await timer.WaitForNextTickAsync(stoppingToken))
                {
                    try
                    {
                        await SweepOnceAsync();
                    }
                    catch (Exception e)
                    {
                        _logger.LogError(e, "ExpeditionLock sweep failed");
                    }
                }
            }
            catch (OperationCanceledException)
            {
            }
        }

        public async Task SweepOnceAsync()
        {
            foreach (var key in _registry.ExpireIdle())
            {
                // Les clés sont déjà retirées du registre : un échec de diffusion est perdu, il est donc journalisé
                // sans empêcher la diffusion des autres.
                try
                {
                    var dto = new ExpeditionLockDto { Kind = ExpeditionLockDto.KindName(key.Kind), EntityId = key.EntityId };
                    await _hubContext.Clients.Group(key.MapId.ToString())
                        .SendAsync(ExpeditionsHubEvent.ExpeditionLockChanged.GetDescription(), dto);
                }
                catch (Exception e)
                {
                    _logger.LogError(e, "ExpeditionLock broadcast failed map {MapId} {Kind} {EntityId}", key.MapId, key.Kind, key.EntityId);
                }
            }
        }
    }
}
