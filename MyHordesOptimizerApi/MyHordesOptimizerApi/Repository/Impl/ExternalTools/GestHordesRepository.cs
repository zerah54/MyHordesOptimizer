using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;

namespace MyHordesOptimizerApi.Repository.Impl.ExternalTools
{
    public class GestHordesRepository : AbstractWebApiRepositoryBase, IGestHordesRepository
    {
        public override string HttpClientName => nameof(GestHordesRepository);
        protected IUserInfoProvider UserKeyProvider { get; private set; }
        protected IGestHordesConfiguration GestHordesConfiguration { get; private set; }

        private const string Cookie_MyHordesKey_Key = "myHordesKey";
        private const string Cookie_MyHordesId_Key = "myHordesId";

        public GestHordesRepository(ILogger<GestHordesRepository> logger,
           IHttpClientFactory httpClientFactory,
           IUserInfoProvider userKeyProvider,
           IGestHordesConfiguration gestHordesConfiguration
           ) : base(logger, httpClientFactory)
        {
            UserKeyProvider = userKeyProvider;
            GestHordesConfiguration = gestHordesConfiguration;
        }

        public void UpdateGHZoneRegen(string sessid, List<dynamic> cellToUpdate)
        {
            var majHeaders = new Dictionary<string, string>()
            {
                {"Cookie", $"PHPSESSID={sessid}" }
            };
            majHeaders.Add("X-Requested-With", "XMLHttpRequest");
            foreach(var cell in cellToUpdate)
            {
                var cellAsJObject = cell as JObject;
                var body = cellAsJObject.ToObject<Dictionary<string, object>>();
                var majResponse = base.Post<GestHordesUpdateCaseResponse>(url: $"{GestHordesConfiguration.Url}/{GestHordesConfiguration.MajCasePath}", body: body, customHeader: majHeaders, mediaTypeIn : "application/x-www-form-urlencoded");
            }
        }

        public void Update()
        {
            Dictionary<string, string> majHeaders = GetGHHeaders();

            var majBody = new GestHordesMajRequest()
            {
                Key = UserKeyProvider.UserKey
            };
            var majResponse = base.Post<GestHordesMajResponse>(url: $"{GestHordesConfiguration.Url}/{GestHordesConfiguration.MajPath}", body: majBody, customHeader: majHeaders);
        }


        public void UpdateCell(IDictionary<string, object> dictionnary)
        {
            Dictionary<string, string> majHeaders = GetGHHeaders();
            majHeaders.Add("X-Requested-With", "XMLHttpRequest");
            var majResponse = base.Post<GestHordesUpdateCaseResponse>(url: $"{GestHordesConfiguration.Url}/{GestHordesConfiguration.MajCasePath}", body: dictionnary, customHeader: majHeaders, mediaTypeIn: "application/x-www-form-urlencoded");
        }

        private Dictionary<string, string> GetGHHeaders()
        {
            var loginUrl = $"{GestHordesConfiguration.Url}/{GestHordesConfiguration.LoginPath}";
            var loginRequestDto = new GestHordesLoginRequest()
            {
                Key = UserKeyProvider.UserKey
            };

            var cookieContainer = new CookieContainer();
            var uri = new Uri(loginUrl);
            string sessid = string.Empty;
            string rememberMe = string.Empty;
            using (var httpClientHandler = new HttpClientHandler
            {
                CookieContainer = cookieContainer
            })
            {
                using (var httpClient = new HttpClient(httpClientHandler))
                {
                    var result = httpClient.PostAsync(uri, loginRequestDto.ToFormUrlEncodedContent()).Result;
                    var cookie = cookieContainer.GetCookies(uri);
                    sessid = cookie.FirstOrDefault(x => x.Name == "PHPSESSID")?.Value;
                    rememberMe = cookie.FirstOrDefault(x => x.Name == "REMEMBERME")?.Value;
                };
            }

            var majUrl = $"{GestHordesConfiguration.Url}/{GestHordesConfiguration.MajPath}";
            var majHeaders = new Dictionary<string, string>()
            {
                {"Cookie", $"PHPSESSID={sessid};REMEMBERME={rememberMe}" }
            };
            return majHeaders;
        }

        protected override void CustomizeHttpClient(HttpClient client)
        {
            base.CustomizeHttpClient(client);
        }
    }
}
