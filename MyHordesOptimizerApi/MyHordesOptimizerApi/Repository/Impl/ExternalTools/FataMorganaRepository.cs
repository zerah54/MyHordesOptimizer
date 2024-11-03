using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using System;
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
        private string _parameterDeadZombies = "deadzombies";

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

        public async Task UpdateAsync()
        {
            try
            {
                var url = AddParameterToQuery($"{FataMorganaConfiguration.Url}/{_endpointUpdateMyZone}", _parameterUserKey, UserKeyProvider.UserKey);
                var response = base.Post(url: url, body: null);
            }
            catch (Exception e)
            {
                Logger.LogWarning(e, e.Message);
                throw;
            }
        }

        public async Task UpdateAsync(int chaosX, int chaosY, int deadZombie)
        {
            try
            {
                var url = AddParameterToQuery($"{FataMorganaConfiguration.Url}/{_endpointUpdateMyZone}", _parameterUserKey, UserKeyProvider.UserKey);
                url = AddParameterToQuery(url, _parameterChaosX, chaosX);
                url = AddParameterToQuery(url, _parameterChaosY, chaosY);
                url = AddParameterToQuery(url, _parameterDeadZombies, deadZombie);
                var response = base.Post(url: url, body: null);
            }
            catch (Exception e)
            {
                Logger.LogWarning(e, e.Message);
                throw;
            }
        }
    }
}
