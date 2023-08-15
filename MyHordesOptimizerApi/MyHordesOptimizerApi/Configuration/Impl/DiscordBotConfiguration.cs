using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces;

namespace MyHordesOptimizerApi.Configuration.Impl
{
    public class DiscordBotConfiguration : IDiscordBotConfiguration
    {
        public string Token => _configuration.GetValue<string>("Token");
        public long Guild => _configuration.GetValue<long>("Guild");

        private IConfigurationSection _configuration;

        public DiscordBotConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("DiscordBot");
        }
    }
}
