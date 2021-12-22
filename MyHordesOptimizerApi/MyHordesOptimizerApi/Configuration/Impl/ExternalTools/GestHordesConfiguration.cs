using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;

namespace MyHordesOptimizerApi.Configuration.Impl.ExternalTools
{
    public class GestHordesConfiguration : IGestHordesConfiguration
    {
        public string Url => _configuration.GetValue<string>("Url");

        private IConfigurationSection _configuration;

        public GestHordesConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("ExternalTools:GestHordes");
        }
    }
}
