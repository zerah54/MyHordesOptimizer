using MyHordesOptimizerApi.Exceptions;
using System.Net.Http;

namespace MyHordesOptimizerApi.Extensions
{
    public static class HttpResponseMessageExtensions
    {
        public static void EnsureSuccessStatusCodeEnriched(this HttpResponseMessage response)
        {
            var content = response.Content.ReadAsStringAsync().Result;
            try
            {
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException e)
            {
                throw new WebApiException(e.Message, content, response.StatusCode, e);
            }
        }
    }
}
