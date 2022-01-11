using Common.Core.Repository.Interfaces;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Extensions;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Mime;
using System.Text;
using System.Web;

namespace MyHordesOptimizerApi.Repository.Abstract
{
    public abstract class AbstractWebApiRepositoryBase : IWebApiRepository
    {
        protected ILogger<AbstractWebApiRepositoryBase> Logger { get; set; }

        protected IHttpClientFactory HttpClientFactory { get; private set; }

        public abstract string HttpClientName { get; }

        protected AbstractWebApiRepositoryBase(ILogger<AbstractWebApiRepositoryBase> logger, IHttpClientFactory httpClientFactory)
        {
            Logger = logger;
            HttpClientFactory = httpClientFactory;
        }

        #region Post

        public TResult Post<TResult>(string url,
            object body,
            bool ensureStatusCode = true,
            Dictionary<string, string> customHeader = null,
            string mediaTypeIn = MediaTypeNames.Application.Json,
            string mediaTypeOut = null)
        {
            var response = Post(url: url,
                body: body,
                ensureStatusCode: ensureStatusCode,
                customHeaders: customHeader,
                mediaTypeIn: mediaTypeIn);
            var stringResult = response.Content.ReadAsStringAsync().Result;
            return GetResult<TResult>(mediaTypeOut, stringResult);

        }

        public HttpResponseMessage Post(string url,
            object body,
            bool ensureStatusCode = true,
            Dictionary<string, string> customHeaders = null,
            string mediaTypeIn = MediaTypeNames.Application.Json)
        {
            var client = CreateClient();
            AddCustomHeaders(client, customHeaders);
            Logger.LogDebug($"POST call initiated [HttpRequestUrl={url}]");
            var content = GenerateContent(mediaTypeIn, body);
            var response = client.PostAsync(url, content).Result;
            Logger.LogDebug($"Async POST call completed [HttpRequestUrl={url}] [HttpResponseStatus={response.StatusCode}]");

            if (ensureStatusCode)
            {
                response.EnsureSuccessStatusCodeEnriched();
            }

            return response;
        }

        #endregion

        #region Patch

        public TResult Patch<TResult>(string url,
            object body,
            bool ensureStatusCode = true,
            Dictionary<string, string> customHeader = null,
            string mediaTypeIn = MediaTypeNames.Application.Json,
            string mediaTypeOut = null)
        {
            var response = Patch(url: url,
                body: body,
                ensureStatusCode: ensureStatusCode,
                customHeaders: customHeader,
                mediaTypeIn: mediaTypeIn);
            var stringResult = response.Content.ReadAsStringAsync().Result;
            return GetResult<TResult>(mediaTypeOut, stringResult);

        }

        public HttpResponseMessage Patch(string url,
            object body,
            bool ensureStatusCode = true,
            Dictionary<string, string> customHeaders = null,
            string mediaTypeIn = MediaTypeNames.Application.Json)
        {
            var client = CreateClient();
            AddCustomHeaders(client, customHeaders);
            Logger.LogDebug($"PATCH call initiated [HttpRequestUrl={url}]");
            var content = GenerateContent(mediaTypeIn, body);
            var response = client.PatchAsync(url, content).Result;
            Logger.LogDebug($"Async PATCH call completed [HttpRequestUrl={url}] [HttpResponseStatus={response.StatusCode}]");

            if (ensureStatusCode)
            {
                response.EnsureSuccessStatusCodeEnriched();
            }

            return response;
        }

        #endregion

        #region Put

        public TResult Put<TResult>(string url,
            object body,
            bool ensureStatusCode = true,
            Dictionary<string, string> customHeaders = null,
            string mediaTypeIn = MediaTypeNames.Application.Json,
            string mediaTypeOut = null)
        {
            var response = Put(url: url,
               body: body,
               ensureStatusCode: ensureStatusCode,
               customHeaders: customHeaders,
               mediaTypeIn: mediaTypeIn);
            var stringResult = response.Content.ReadAsStringAsync().Result;
            return GetResult<TResult>(mediaTypeOut, stringResult);
        }

        public HttpResponseMessage Put(string url,
            object body,
            bool ensureStatusCode = true,
            Dictionary<string, string> customHeaders = null,
            string mediaTypeIn = MediaTypeNames.Application.Json)
        {
            var client = CreateClient();
            AddCustomHeaders(client, customHeaders);
            Logger.LogDebug($"PUT call initiated [HttpRequestUrl={url}]");
            var content = GenerateContent(mediaTypeIn, body);
            var response = client.PutAsync(url, content).Result;
            Logger.LogDebug($"Async PUT call completed [HttpRequestUrl={url}] [HttpResponseStatus={response.StatusCode}]");

            if (ensureStatusCode)
            {
                response.EnsureSuccessStatusCodeEnriched();
            }

            return response;
        }

        #endregion


        #region Get

        public TResult Get<TResult>(string url,
            Dictionary<string, string> parameters = null,
            bool ensureStatusCode = true,
            Dictionary<string, string> customHeaders = null,
            string mediaTypeOut = null)
        {
            var response = Get(url: url,
              ensureStatusCode: ensureStatusCode,
              customHeaders: customHeaders);
            var stringResult = response.Content.ReadAsStringAsync().Result;
            return GetResult<TResult>(mediaTypeOut, stringResult);
        }

        public HttpResponseMessage Get(string url,
            Dictionary<string, string> parameters = null,
            bool ensureStatusCode = true,
            Dictionary<string, string> customHeaders = null)
        {
            var client = CreateClient();
            AddCustomHeaders(client, customHeaders);
            Logger.LogDebug($"GET call initiated [HttpRequestUrl={url}]");
            var query = parameters != null ? QueryHelpers.AddQueryString(url, parameters) : url;
            var response = client.GetAsync(query).Result;
            Logger.LogDebug($"Async GET call completed [HttpRequestUrl={url}] [HttpResponseStatus={response.StatusCode}]");

            if (ensureStatusCode)
            {
                response.EnsureSuccessStatusCodeEnriched();
            }

            return response;
        }

        #endregion

        protected virtual void AddCustomHeaders(HttpClient client, Dictionary<string, string> customHeaders = null)
        {
            if (customHeaders != null)
            {
                foreach (var header in customHeaders)
                {
                    client.DefaultRequestHeaders.Add(header.Key, header.Value);
                }
            }
        }

        #region Utility 

        protected HttpClient CreateClient()
        {
            if (string.IsNullOrWhiteSpace(HttpClientName))
                return HttpClientFactory.CreateClient();

            var client = HttpClientFactory.CreateClient(HttpClientName);
            if (client == null)
                throw new Exception($"HttpClient not found with name : {HttpClientName}");
            CustomizeHttpClient(client);
            return client;
        }

        protected virtual void CustomizeHttpClient(HttpClient client)
        {
           // Do nothing here
        }

        protected string AddParameterToQuery(string url, string parameterKey, object parameterValue)
        {
            var uriBulder = new UriBuilder(url);
            var query = HttpUtility.ParseQueryString(uriBulder.Query);
            query[parameterKey] = parameterValue.ToString();
            uriBulder.Query = query.ToString();
            return uriBulder.ToString();
        }


        private static TResult GetResult<TResult>(string mediaTypeOut, string stringResult)
        {
            switch (mediaTypeOut)
            {
                case MediaTypeNames.Application.Json:
                    return stringResult.FromJson<TResult>();
                case MediaTypeNames.Application.Xml:
                    return stringResult.FromXml<TResult>();
                default:
                    return stringResult.FromJson<TResult>();
            }
        }

        private HttpContent GenerateContent(string mediaTypeName, object body)
        {
            switch (mediaTypeName)
            {
                case MediaTypeNames.Application.Json:
                    {
                        return GenerateJsonContent(body);
                    }
                case "application/x-www-form-urlencoded":
                    {
                        var content = body.ToFormUrlEncodedContent();
                        Logger.LogDebug($"Request [HttpBody={content.ToString()}]");
                        return content;
                    }
                case MediaTypeNames.Text.Plain:
                    {
                        var stringBody = body?.ToString();
                        if (stringBody == null)
                        {
                            stringBody = string.Empty;
                        }
                        Logger.LogDebug($"Request [HttpBody={stringBody}]");
                        return new StringContent(stringBody, Encoding.UTF8, mediaTypeName);
                    }
                default:
                    {
                        return GenerateJsonContent(body);
                    }
            }

        }

        protected virtual HttpContent GenerateJsonContent(object body)
        {
            var stringBody = body?.ToJson();
            if (stringBody == null)
            {
                stringBody = string.Empty;
            }
            Logger.LogDebug($"Request [HttpBody={stringBody}]");
            return new StringContent(stringBody, Encoding.UTF8, MediaTypeNames.Application.Json);
        }
    }

    #endregion
}
