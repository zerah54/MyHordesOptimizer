using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;

namespace MyHordesOptimizerApi.Configuration.Impl.ExternalTools
{
    public class ZenHordesConfiguration : IZenHordesConfiguration
    {
        public string Url => _configuration.GetValue<string>("Url")!;

        private IConfigurationSection _configuration;

        public ZenHordesConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("ExternalTools:ZenHordes");
        }
    }
}
