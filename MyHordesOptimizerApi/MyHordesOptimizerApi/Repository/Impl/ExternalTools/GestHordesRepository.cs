using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using System.Net.Http;

namespace MyHordesOptimizerApi.Repository.Impl.ExternalTools
{
    public class GestHordesRepository : AbstractWebApiRepositoryBase, IGestHordesRepository
    {
        public override string HttpClientName => nameof(GestHordesRepository);
        protected IUserKeyProvider UserKeyProvider { get; private set; }
        protected IGestHordeCookieProvider GestHordeCookieProvider { get; private set; }
        protected IGestHordesConfiguration GestHordesConfiguration { get; private set; }

        private string _parameterReset = "reset";

        public GestHordesRepository(ILogger<GestHordesRepository> logger,
           IHttpClientFactory httpClientFactory,
           IUserKeyProvider userKeyProvider,
           IGestHordesConfiguration gestHordesConfiguration
           ) : base(logger, httpClientFactory)
        {
            UserKeyProvider = userKeyProvider;
            GestHordesConfiguration = gestHordesConfiguration;
        }

        public void Update()
        {
            var url = AddParameterToQuery($"{GestHordesConfiguration.Url}", _parameterReset, string.Empty);
            base.Get(url: url);
        }

        protected override void CustomizeHttpClient(HttpClient client)
        {
            base.CustomizeHttpClient(client);
            client.DefaultRequestHeaders.Add("Cookie", "auth=ArbitrarySessionToken");
        }
    }
}
