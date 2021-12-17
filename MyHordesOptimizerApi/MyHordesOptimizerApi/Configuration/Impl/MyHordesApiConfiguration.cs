using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces;

namespace MyHordesOptimizerApi.Configuration.Impl
{
    public class MyHordesApiConfiguration : IMyHordesApiConfiguration
    {
        public string Url => _configuration.GetValue<string>("Url");
        public string AppKey => _configuration.GetValue<string>("AppKey");

        private IConfigurationSection _configuration;

        public MyHordesApiConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("MyHordes");
        }
    }
}
