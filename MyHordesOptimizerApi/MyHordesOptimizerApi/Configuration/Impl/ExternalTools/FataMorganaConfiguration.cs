using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;

namespace MyHordesOptimizerApi.Configuration.Impl.ExternalTools
{
    public class FataMorganaConfiguration : IFataMorganaConfiguration
    {
        public string Url => _configuration.GetValue<string>("Url");

        private IConfigurationSection _configuration;

        public FataMorganaConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("ExternalTools:FataMorgana");
        }
    }
}
