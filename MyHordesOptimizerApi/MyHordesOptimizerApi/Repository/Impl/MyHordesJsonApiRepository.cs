using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
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
            var url = GenerateUrl(EndpointItems);
            return base.Get<Dictionary<string, MyHordesJsonItem>>(url);
        }

        public MyHordesMeResponseDto GetMe()
        {
            var url = GenerateUrl(EndpointMe);
            url = AddParameterToQuery(url, _parameterFields, "id,map.fields(id, city.fields(bank, chantiers, buildings, name, water, x, y, door, chaos, hard, devast), citizens, wid, hei, consiparcy, cadavers)");
            var response = base.Get<MyHordesMeResponseDto>(url);
            return response;
        }
    }
}