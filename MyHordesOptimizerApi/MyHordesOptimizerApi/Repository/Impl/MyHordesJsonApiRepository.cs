using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Net.Http;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class MyHordesJsonApiRepository : AbstractMyHordeRepositoryBase, IMyHordesJsonApiRepository
    {
        public override string HttpClientName => nameof(MyHordesJsonApiRepository);

        protected override string BaseEndpoint => "json";

        public MyHordesJsonApiRepository(ILogger<MyHordesJsonApiRepository> logger,
            IHttpClientFactory httpClientFactory,
            IMyHordesApiConfiguration myHordesApiConfiguration,
            IUserKeyProvider userKeyProvider) : base(logger, httpClientFactory, myHordesApiConfiguration, userKeyProvider)
        {
        }

        public Dictionary<string, MyHordesJsonItem> GetItems()
        {
            string url = GenerateUrl(EndpointItems);
            return base.Get<Dictionary<string, MyHordesJsonItem>>(url);
        }
    }
}
