﻿using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.MajCase;
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
                {"Cookie", $"gh_session_id={sessid}" },
            };
            majHeaders.Add("X-Requested-With", "XMLHttpRequest");
            majHeaders.Add("X-Source", "MyHordes Optimizer");
            foreach(var cell in cellToUpdate)
            {
                var cellAsJObject = cell as JObject;
                var body = cellAsJObject.ToObject<Dictionary<string, object>>();
                var majResponse = base.Post<GestHordesUpdateCaseResponse>(url: $"{GestHordesConfiguration.Url}/{GestHordesConfiguration.MajCasePath}", body: body, customHeader: majHeaders, mediaTypeIn : "application/x-www-form-urlencoded");
            }
        }

        public void Update()
        {
            var majBody = new GestHordesMajRequest()
            {
                Key = UserKeyProvider.UserKey
            };
            var customHeaders = new Dictionary<string, string>() { };
            customHeaders.Add("X-Source", "MyHordes Optimizer");
            var majResponse = base.Post<GestHordesMajResponse>(url: $"{GestHordesConfiguration.Url}/{GestHordesConfiguration.MajPath}", body: majBody, customHeader: customHeaders, mediaTypeIn : "application/x-www-form-urlencoded");
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
                    sessid = cookie.FirstOrDefault(x => x.Name == "gh_session_id")?.Value;
                    rememberMe = cookie.FirstOrDefault(x => x.Name == "gh_remember_me")?.Value;
                };
            }

            var majUrl = $"{GestHordesConfiguration.Url}/{GestHordesConfiguration.MajPath}";
            var majHeaders = new Dictionary<string, string>()
            {
                {"Cookie", $"gh_session_id={sessid};gh_remember_me={rememberMe}" },
                {"X-Source", "MyHordes Optimizer"}
            };
            return majHeaders;
        }

        public void UpdateCitizen(GestHordesMajCitizenRequest ghUpdateCitizenRequest)
        {
            var customHeaders = new Dictionary<string, string>() { };
            customHeaders.Add("X-Source", "MyHordes Optimizer");
            var majResponse = base.Post<GestHordesMajResponse>(url: $"{GestHordesConfiguration.Url}/{GestHordesConfiguration.MajCitizenPath}", body: ghUpdateCitizenRequest, customHeader: customHeaders);
        }

        protected override void CustomizeHttpClient(HttpClient client)
        {
            base.CustomizeHttpClient(client);
        }

        public void UpdateCellItem(GestHordesMajCaseRequestDto request)
        {
            request.UserKey = UserKeyProvider.UserKey;
            var majUrl = $"{GestHordesConfiguration.Url}/{GestHordesConfiguration.MajCasePath}";
            var customHeaders = new Dictionary<string, string>() { };
            customHeaders.Add("X-Source", "MyHordes Optimizer");
            base.Post(url: majUrl, body: request, customHeaders: customHeaders);
        }

        public void UpdateCellZombies(GestHordesMajCaseZombiesDto request)
        {
            request.UserKey = UserKeyProvider.UserKey;
            var majUrl = $"{GestHordesConfiguration.Url}/{GestHordesConfiguration.MajZombieTuePath}";
            var customHeaders = new Dictionary<string, string>() { };
            customHeaders.Add("X-Source", "MyHordes Optimizer");
            base.Post(url: majUrl, body: request, customHeaders: customHeaders);
        }
    }
}
