using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces;

namespace MyHordesOptimizerApi.Configuration.Impl
{
    public class DiscordBotConfiguration : IDiscordBotConfiguration
    {
        public string Token => _configuration.GetValue<string>("Token");
        public ulong SupportGuildId => _configuration.GetValue<ulong>("SupportGuildId");
        public ulong SuggestionsChannelId => _configuration.GetValue<ulong>("SuggestionsChannelId");
        public ulong BugsChannelId => _configuration.GetValue<ulong>("BugsChannelId");

        private IConfigurationSection _configuration;

        public DiscordBotConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("DiscordBot");
        }
    }
}
