using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Providers.Interfaces;
using System;
using System.Net.Http;
using System.Web;

namespace MyHordesOptimizerApi.Repository.Abstract
{
    public abstract class AbstractMyHordeRepositoryBase : AbstractWebApiRepositoryBase
    {
        protected abstract string BaseEndpoint { get; }
        protected IMyHordesApiConfiguration MyHordesApiConfiguration { get; set; }
        protected IUserInfoProvider UserKeyProvider { get; set; }

        protected const string _parameterAppKey = "appkey";
        protected const string _parameterUserKey = "userkey";
        protected const string _parameterFields = "fields";

        protected const string EndpointItems = "items";
        protected const string EndpointMe = "me";


        protected AbstractMyHordeRepositoryBase(ILogger<AbstractMyHordeRepositoryBase> logger,
          IHttpClientFactory httpClientFactory,
          IMyHordesApiConfiguration myHordesApiConfiguration,
          IUserInfoProvider userKeyProvider) : base(logger, httpClientFactory)
        {
            MyHordesApiConfiguration = myHordesApiConfiguration;
            UserKeyProvider = userKeyProvider;
        }

        protected string GenerateUrl(string endpoint)
        {
            var uriBulder = new UriBuilder($"{MyHordesApiConfiguration.Url}/{BaseEndpoint}/{endpoint}");
            var query = HttpUtility.ParseQueryString(uriBulder.Query);
            query[_parameterAppKey] = MyHordesApiConfiguration.AppKey;
            query[_parameterUserKey] = UserKeyProvider.UserKey;
            uriBulder.Query = query.ToString();
            var url = uriBulder.ToString();
            return url;
        }
    }
}
