using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using System.Net.Http;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Repository.Impl.ExternalTools
{
    public class FataMorganaRepository : AbstractWebApiRepositoryBase, IFataMorganaRepository
    {
        public override string HttpClientName => nameof(FataMorganaRepository);
        protected IUserInfoProvider UserKeyProvider { get; private set; }
        protected IFataMorganaConfiguration FataMorganaConfiguration { get; private set; }

        private string _parameterUserKey = "key";
        private string _parameterChaosX = "chaosx";
        private string _parameterChaosY = "chaosy";

        private string _endpointMap = "map";
        private string _endpointUpdateMyZone = "update";

        public FataMorganaRepository(ILogger<FataMorganaRepository> logger,
            IHttpClientFactory httpClientFactory,
            IUserInfoProvider userKeyProvider,
            IFataMorganaConfiguration fataMorganaConfiguration
            ) : base(logger, httpClientFactory)
        {
            UserKeyProvider = userKeyProvider;
            FataMorganaConfiguration = fataMorganaConfiguration;
        }


        public async Task UpdateAsync(bool updateInChaos = false, int? chaosX = null, int? chaosY = null)
        {
            var url = AddParameterToQuery($"{FataMorganaConfiguration.Url}/{_endpointUpdateMyZone}", _parameterUserKey, UserKeyProvider.UserKey);
            if (updateInChaos)
            {
                if (!chaosX.HasValue || !chaosY.HasValue)
                {
                    throw new MhoTechnicalException("You must provide chaosX and chaosY when using with updateInChaos = true");
                }
                url = AddParameterToQuery(url, _parameterChaosX, chaosX);
                url = AddParameterToQuery(url, _parameterChaosY, chaosY);
            }
            var response = base.Post(url: url, body: null);
            var hehe = await response.Content.ReadAsStringAsync();
        }
    }
}
