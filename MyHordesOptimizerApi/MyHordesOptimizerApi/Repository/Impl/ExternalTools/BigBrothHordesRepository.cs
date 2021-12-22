using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using System;
using System.Net.Http;
using System.Web;

namespace MyHordesOptimizerApi.Repository.Impl.ExternalTools
{
    public class BigBrothHordesRepository : AbstractWebApiRepositoryBase, IBigBrothHordesRepository
    {
        public override string HttpClientName => nameof(BigBrothHordesRepository);
        protected IUserKeyProvider UserKeyProvider { get; private set; }
        protected IBigBrothHordesConfiguration BigBrothHordesConfiguration { get; private set; }

        private const string _parameterUserKey = "key";
        private const string _parameterSid = "sid";
        private const string _endpointUpdate = "update.php";

        public BigBrothHordesRepository(ILogger<BigBrothHordesRepository> logger,
            IHttpClientFactory httpClientFactory,
            IUserKeyProvider userKeyProvider,
            IBigBrothHordesConfiguration bigBrothHordesConfiguration
            ) : base(logger, httpClientFactory)
        {
            UserKeyProvider = userKeyProvider;
            BigBrothHordesConfiguration = bigBrothHordesConfiguration;
        }

        public void Update()
        {
            var url = GenerateUrl(_endpointUpdate);
            url = AddParameterToQuery(url, _parameterSid, BigBrothHordesConfiguration.SidMyHordes);

            base.Post(url: url, body: null);
        }

        protected string GenerateUrl(string endpoint)
        {
            return AddParameterToQuery($"{BigBrothHordesConfiguration.Url}/{endpoint}", _parameterUserKey, UserKeyProvider.UserKey); 
        }
    }
}
