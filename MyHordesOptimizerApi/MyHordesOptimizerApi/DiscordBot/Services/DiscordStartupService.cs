using System.Threading;
using System.Threading.Tasks;
using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.DiscordBot.Utility;

namespace MyHordesOptimizerApi.DiscordBot.Services
{
    public class DiscordStartupHostedService : IHostedService
    {
        private readonly DiscordSocketClient _discordSocketClient;
        private readonly IDiscordBotConfiguration _configuration;
        private readonly ILogger<DiscordStartupHostedService> _logger;

        public DiscordStartupHostedService(
            DiscordSocketClient discord, 
            IDiscordBotConfiguration configuration, 
            ILogger<DiscordStartupHostedService> logger)
        {
            _discordSocketClient = discord;
            _configuration = configuration;
            _logger = logger;

            _discordSocketClient.Log += msg => LogHelper.OnLogAsync(_logger, msg);
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            await _discordSocketClient.LoginAsync(TokenType.Bot, _configuration.Token);
            await _discordSocketClient.StartAsync();
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            await _discordSocketClient.LogoutAsync();
            await _discordSocketClient.StopAsync();
        }
    }
}