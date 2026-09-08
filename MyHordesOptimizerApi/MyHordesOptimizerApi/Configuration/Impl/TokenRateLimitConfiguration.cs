using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces;

namespace MyHordesOptimizerApi.Configuration.Impl
{
    public class TokenRateLimitConfiguration : ITokenRateLimitConfiguration
    {
        public int PermitLimit => _configuration.GetValue<int>("PermitLimit");
        public int WindowMinutes => _configuration.GetValue<int>("WindowMinutes");

        private readonly IConfigurationSection _configuration;

        public TokenRateLimitConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("TokenApiLimit");
        }
    }
}
