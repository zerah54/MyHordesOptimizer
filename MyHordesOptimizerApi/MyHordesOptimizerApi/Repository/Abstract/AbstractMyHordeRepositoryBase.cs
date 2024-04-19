using System;
using System.Net;
using System.Net.Http;
using System.Web;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Providers.Interfaces;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

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
        protected const string _parameterLanguages = "languages";

        protected const string EndpointItems = "items";
        protected const string EndpointMe = "me";
        protected const string EndpointRuins = "ruins";
        protected const string EndpointBuilding = "buildings";


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
            query[_parameterLanguages] = "fr,es,en,de";
            uriBulder.Query = query.ToString();
            var url = uriBulder.ToString();
            return url;
        }

        protected override TResult GetResult<TResult>(string mediaTypeOut, string stringResult)
        {
            dynamic dynamicResult = JsonConvert.DeserializeObject(stringResult);
            if (dynamicResult != null && ((JToken)dynamicResult).Type == JTokenType.Object &&
                dynamicResult.ContainsKey("error") != null)
            {
                var error = dynamicResult.error;
                if (error == "nightly_attack")
                    throw new MyHordesApiException(message: "Le site est assiégé par des hordes de zombies !", statusCode: HttpStatusCode.ServiceUnavailable);
                if (error == "rate_limit_reached")
                    throw new MyHordesApiException(message: "Quota dépassé. Tout devrait fonctionner de nouveau d'ici quelques minutes.", statusCode: HttpStatusCode.TooManyRequests);
                if (error == "invalid_appkey")
                    throw new MyHordesApiException(message: "Clé d'application invalide.", statusCode: HttpStatusCode.BadRequest);
                if (error == "invalid_userkey")
                    throw new MyHordesApiException(message: "Clé d'utilisateur invalide.", statusCode: HttpStatusCode.BadRequest);
            }

            return base.GetResult<TResult>(mediaTypeOut, stringResult);
        }
    }
}