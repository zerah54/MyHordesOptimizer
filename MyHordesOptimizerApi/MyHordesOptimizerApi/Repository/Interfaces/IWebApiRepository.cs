using System.Collections.Generic;
using System.Net.Http;
using System.Net.Mime;

namespace Common.Core.Repository.Interfaces
{
    public interface IWebApiRepository
    {
        TResult Post<TResult>(string url, object body, bool ensureStatusCode = true, Dictionary<string, string> customHeaders = null, string mediaTypeIn = MediaTypeNames.Application.Json, string mediaTypeOut = null);
        HttpResponseMessage Post(string url, object body, bool ensureStatusCode = true, Dictionary<string, string> customHeaders = null, string mediaTypeIn = MediaTypeNames.Application.Json);
        TResult Put<TResult>(string url, object body, bool ensureStatusCode = true, Dictionary<string, string> customHeaders = null, string mediaTypeIn = MediaTypeNames.Application.Json, string mediaTypeOut = null);
        HttpResponseMessage Put(string url, object body, bool ensureStatusCode = true, Dictionary<string, string> customHeaders = null, string mediaTypeIn = MediaTypeNames.Application.Json);
        TResult Get<TResult>(string url, Dictionary<string, string> parameters = null, bool ensureStatusCode = true, Dictionary<string, string> customHeaders = null, string mediaTypeOut = null);
        HttpResponseMessage Get(string url, Dictionary<string, string> parameters = null, bool ensureStatusCode = true, Dictionary<string, string> customHeaders = null);
    }
}
