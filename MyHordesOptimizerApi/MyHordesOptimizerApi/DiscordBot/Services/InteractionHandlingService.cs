using System;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.DiscordBot.Utility;

namespace MyHordesOptimizerApi.DiscordBot.Services
{
    public class InteractionHandlingHostedService : IHostedService
    {
        private readonly DiscordSocketClient _discordSocketClient;
        private readonly InteractionService _interactionService;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<InteractionHandlingHostedService> _logger;
        private readonly ILocalizationManager _localizationManager;

        public InteractionHandlingHostedService(
            DiscordSocketClient discord,
            InteractionService interactions,
            IServiceProvider services,
            IDiscordBotConfiguration configuration,
            ILogger<InteractionHandlingHostedService> logger,
            ILocalizationManager localizationManager)
        {
            _discordSocketClient = discord;
            _interactionService = interactions;
            _serviceProvider = services;
            _logger = logger;
            _localizationManager = localizationManager;

            _interactionService.Log += msg => LogHelper.OnLogAsync(_logger, msg);
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _discordSocketClient.Ready += RegisterCommandsGloballyAsync;
            _discordSocketClient.InteractionCreated += OnInteractionAsync;
            _interactionService.LocalizationManager = _localizationManager;

            await _interactionService.AddModulesAsync(typeof(InteractionHandlingHostedService).Assembly, _serviceProvider);
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _discordSocketClient.Ready -= RegisterCommandsGloballyAsync;
            _discordSocketClient.InteractionCreated -= OnInteractionAsync;

            _interactionService.Dispose();
            return Task.CompletedTask;
        }

        private async Task RegisterCommandsGloballyAsync()
        {
            await _interactionService.RegisterCommandsGloballyAsync(true);
        }

        private async Task OnInteractionAsync(SocketInteraction interaction)
        {
            try
            {
                var context = new SocketInteractionContext(_discordSocketClient, interaction);
                var result = await _interactionService.ExecuteCommandAsync(context, _serviceProvider);

                if (!result.IsSuccess)
                {
                    if (interaction.HasResponded)
                    {
                        await interaction.FollowupAsync($"Une erreur est survenue : {result.ErrorReason}", ephemeral: true);
                    }
                    else
                    {
                        await interaction.RespondAsync($"Une erreur est survenue : {result.ErrorReason}", ephemeral: true);
                    }
                }
            }
            catch (Exception e)
            {
                _logger.LogWarning(e.ToString(), e);
                if (interaction.Type == InteractionType.ApplicationCommand)
                {
                    await interaction.GetOriginalResponseAsync()
                        .ContinueWith(msg => msg.Result?.DeleteAsync());
                }
            }
        }
    }
}