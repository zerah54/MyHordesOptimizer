using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;

namespace MyHordesOptimizerApi.Configuration.Impl.ExternalTools
{
    public class GestHordesConfiguration : IGestHordesConfiguration
    {
        public string Url => _configuration.GetValue<string>("Url");

        public string LoginPath => _configuration.GetValue<string>("LoginPath");

        public string MajPath => _configuration.GetValue<string>("MajPath");

        public string MajCasePath => _configuration.GetValue<string>("MajCasePath");

        private IConfigurationSection _configuration;

        public GestHordesConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("ExternalTools:GestHordes");
        }
    }
}
