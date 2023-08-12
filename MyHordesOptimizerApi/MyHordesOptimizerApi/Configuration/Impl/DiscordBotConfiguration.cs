using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces;

namespace MyHordesOptimizerApi.Configuration.Impl
{
    public class DiscordBotConfiguration : IDiscordBotConfiguration
    {
        public string Token => _configuration.GetValue<string>("Token");

        private IConfigurationSection _configuration;

        public DiscordBotConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("DiscordBot");
        }
    }
}
