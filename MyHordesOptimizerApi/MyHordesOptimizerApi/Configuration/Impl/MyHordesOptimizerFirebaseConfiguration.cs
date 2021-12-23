using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces;

namespace MyHordesOptimizerApi.Configuration.Impl
{
    public class MyHordesOptimizerFirebaseConfiguration : IMyHordesOptimizerFirebaseConfiguration
    {
        public string Type => _configuration.GetValue<string>("type");

        public string ProjectId => _configuration.GetValue<string>("project_id");

        public string PrivateKeyId => _configuration.GetValue<string>("private_key_id");

        public string PrivateKey => _configuration.GetValue<string>("private_key");

        public string ClientEmail => _configuration.GetValue<string>("client_email");

        public string ClientId => _configuration.GetValue<string>("client_id");

        public string AuthUri => _configuration.GetValue<string>("auth_uri");

        public string TokenUri => _configuration.GetValue<string>("token_uri");

        public string AuthProviderX509CertUrl => _configuration.GetValue<string>("auth_provider_x509_cert_url");

        public string ClientX509CertUrl => _configuration.GetValue<string>("client_x509_cert_url");
        public string ApiKey => _configuration.GetValue<string>("api_key");
        public string Url => _configuration.GetValue<string>("url");

        private IConfigurationSection _configuration;

        public MyHordesOptimizerFirebaseConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("Firebase");
        }
    }
}
