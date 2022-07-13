
using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces.MyHordesOptimizerApi.Configuration.Interfaces;

namespace MyHordesOptimizerApi.Configuration.Impl
{
    public class MyHordesTranslationsConfiguration : IMyHordesTranslationsConfiguration
    {
        public string ItemFrUrl => _configuration.GetValue<string>("Items:Fr");

        public string ItemEnUrl => _configuration.GetValue<string>("Items:En");

        public string ItemEsUrl => _configuration.GetValue<string>("Items:Es");

        public string GameFrUrl => _configuration.GetValue<string>("Game:Fr");

        public string GameEnUrl => _configuration.GetValue<string>("Game:En");

        public string GameEsUrl => _configuration.GetValue<string>("Game:Es");

        private IConfigurationSection _configuration;

        public MyHordesTranslationsConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("Traductions");
        }
    }
}