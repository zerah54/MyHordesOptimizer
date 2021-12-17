using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Web;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class MyHordesApiRepository : AbstractWebApiRepositoryBase, IMyHordesApiRepository
    {
        public override string HttpClientName => nameof(MyHordesApiRepository);
        protected IMyHordesApiConfiguration MyHordesApiConfiguration { get; set; }

        private const string _endpointItems = "items";
        private const string _parameterAppKey = "appkey";

        public MyHordesApiRepository(ILogger<MyHordesApiRepository> logger,
            IHttpClientFactory httpClientFactory,
            IMyHordesApiConfiguration myHordesApiConfiguration) : base(logger, httpClientFactory)
        {
            MyHordesApiConfiguration = myHordesApiConfiguration;
        }

        public Dictionary<string, MyHordesItem> GetItems()
        {
            string url = GenerateUrl(_endpointItems);
            return base.Get<Dictionary<string, MyHordesItem>>(url);
        }

        private string GenerateUrl(string endpoint)
        {
            var uriBulder = new UriBuilder($"{MyHordesApiConfiguration.Url}/{endpoint}");
            var query = HttpUtility.ParseQueryString(uriBulder.Query);
            query[_parameterAppKey] = MyHordesApiConfiguration.AppKey;
            uriBulder.Query = query.ToString();
            var url = uriBulder.ToString();
            return url;
        }
    }
}
