using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces;

namespace MyHordesOptimizerApi.Configuration.Impl
{
    public class AuthenticationConfiguration : IAuthenticationConfiguration
    {
        private IConfiguration _configuration;
        private IConfiguration _jwtConfiguration;
        public string JwtSecret => _jwtConfiguration.GetValue<string>("Secret");
        public string JwtIssuer => _jwtConfiguration.GetValue<string>("Issuer");
        public string JwtAudience => _jwtConfiguration.GetValue<string>("Audience");
        public int JwtValideTimeInMinute => _jwtConfiguration.GetValue<int>("ValideTimeInMinute");

        public AuthenticationConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("Authentication");
            _jwtConfiguration = _configuration.GetSection("Jwt");
        }
    }
}
