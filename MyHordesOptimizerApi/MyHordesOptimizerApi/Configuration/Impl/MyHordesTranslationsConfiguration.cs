using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Configuration.Impl
{
    public class MyHordesTranslationsConfiguration : IMyHordesTranslationsConfiguration
    {
        public List<string> Paths => _configuration.GetSection("Paths").Get<List<string>>();

        public string GitLabProjectId => _configuration.GetValue<string>("GitLabProjectId");

        private IConfigurationSection _configuration;

        public MyHordesTranslationsConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("Traductions");
        }
    }
}
