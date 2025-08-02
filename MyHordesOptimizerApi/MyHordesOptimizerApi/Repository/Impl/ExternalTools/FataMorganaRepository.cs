using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.FataMorgana;
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

        private string _endpointMho = "mho";

        public FataMorganaRepository(ILogger<FataMorganaRepository> logger,
            IHttpClientFactory httpClientFactory,
            IUserInfoProvider userKeyProvider,
            IFataMorganaConfiguration fataMorganaConfiguration
            ) : base(logger, httpClientFactory)
        {
            UserKeyProvider = userKeyProvider;
            FataMorganaConfiguration = fataMorganaConfiguration;
        }

        public async Task UpdateAsync(FataMorganaUpdateRequestDto updateRequest)
        {
            try
            {
                updateRequest.AccessKey = FataMorganaConfiguration.ApiKey;
                var url = $"{FataMorganaConfiguration.Url}/{_endpointMho}";
                var response = base.Post(url: url, body: updateRequest);
            }
            catch (Exception e)
            {
                Logger.LogWarning(e, e.Message);
                throw;
            }
        }
    }
}
