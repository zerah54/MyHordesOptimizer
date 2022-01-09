using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using System.Net.Http;

namespace MyHordesOptimizerApi.Repository.Impl.ExternalTools
{
    public class FataMorganaRepository : AbstractWebApiRepositoryBase, IFataMorganaRepository
    {
        public override string HttpClientName => nameof(FataMorganaRepository);
        protected IUserInfoProvider UserKeyProvider { get; private set; }
        protected IFataMorganaConfiguration FataMorganaConfiguration { get; private set; }

        private string _parameterUserKey = "key";

        private string _endpointMap = "map";
        private string _endpointUpdateMyZone = "updatemyzone";

        public FataMorganaRepository(ILogger<FataMorganaRepository> logger,
            IHttpClientFactory httpClientFactory,
            IUserInfoProvider userKeyProvider,
            IFataMorganaConfiguration fataMorganaConfiguration
            ) : base(logger, httpClientFactory)
        {
            UserKeyProvider = userKeyProvider;
            FataMorganaConfiguration = fataMorganaConfiguration;
        }

        public void Update()
        {
            var url = AddParameterToQuery($"{FataMorganaConfiguration.Url}/{_endpointMap}/{_endpointUpdateMyZone}", _parameterUserKey, UserKeyProvider.UserKey);

            base.Post(url: url, body: null);
        }
    }
}
