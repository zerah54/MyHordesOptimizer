using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;

namespace MyHordesOptimizerApi.Configuration.Impl.ExternalTools
{
    public class BigBrothHordesConfiguration : IBigBrothHordesConfiguration
    {
        public string Url => _configuration.GetValue<string>("Url");
        public int SidMyHordes => _configuration.GetValue<int>("SidMyHordes");
        public int SidHordes => _configuration.GetValue<int>("SidHordes");

        private IConfigurationSection _configuration;

        public BigBrothHordesConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("ExternalTools:BigBrothHordes");
        }
    }
}
