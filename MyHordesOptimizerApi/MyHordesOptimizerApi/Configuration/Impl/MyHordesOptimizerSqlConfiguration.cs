using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Repository.Impl;

namespace MyHordesOptimizerApi.Configuration.Impl
{
    public class MyHordesOptimizerSqlConfiguration : IMyHordesOptimizerSqlConfiguration
    {
        public string ConnectionString => _configuration.GetValue<string>("ConnectionString");


        private IConfigurationSection _configuration;

        public MyHordesOptimizerSqlConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("Sql");
        }
    }
}
