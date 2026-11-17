using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Hubs;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.Nightwatch
{
    /// <summary>Libère périodiquement les verrous inactifs et en informe les villes concernées.</summary>
    public sealed class NightwatchPlanLockSweeper : BackgroundService
    {
        public static readonly TimeSpan Period = TimeSpan.FromSeconds(5);

        private readonly IHubContext<NightwatchPlansHub> _hubContext;
        private readonly NightwatchPlanLockRegistry _registry;

        private readonly ILogger<NightwatchPlanLockSweeper> _logger;

        public NightwatchPlanLockSweeper(IHubContext<NightwatchPlansHub> hubContext, NightwatchPlanLockRegistry registry, ILogger<NightwatchPlanLockSweeper> logger)
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
                        _logger.LogError(e, "NightwatchPlanLock sweep failed");
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
                    await _hubContext.Clients.Group(key.MapId.ToString())
                        .SendAsync(NightwatchPlansHubEvent.PlanLockChanged.GetDescription(), new PlanLockDto { PlanId = key.PlanId });
                }
                catch (Exception e)
                {
                    _logger.LogError(e, "NightwatchPlanLock broadcast failed map {MapId} plan {PlanId}", key.MapId, key.PlanId);
                }
            }
        }
    }
}
