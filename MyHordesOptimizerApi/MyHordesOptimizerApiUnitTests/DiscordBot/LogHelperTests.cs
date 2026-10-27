using Discord;
using Discord.WebSocket;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Utility;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.DiscordBot
{
    /// <summary>
    /// Traduction des logs Discord.Net vers ILogger : la reconnexion demandée par la gateway est un
    /// fonctionnement normal, elle ne doit pas remonter comme avertissement.
    /// </summary>
    public class LogHelperTests
    {
        [Fact]
        public async Task Reconnexion_demandee_par_la_gateway_est_journalisee_en_information()
        {
            CapturingLogger<LogHelperTests> logger = new();
            LogMessage message = new(LogSeverity.Warning, "Gateway", "Server requested a reconnect",
                new GatewayReconnectException("Server requested a reconnect"));

            await LogHelper.OnLogAsync(logger, message);

            logger.Entries.Should().ContainSingle().Which.Level.Should().Be(LogLevel.Information);
        }

        [Fact]
        public async Task Autre_avertissement_gateway_reste_un_avertissement()
        {
            CapturingLogger<LogHelperTests> logger = new();
            LogMessage message = new(LogSeverity.Warning, "Gateway", "Heartbeat", new TimeoutException());

            await LogHelper.OnLogAsync(logger, message);

            logger.Entries.Should().ContainSingle().Which.Level.Should().Be(LogLevel.Warning);
        }
    }
}
