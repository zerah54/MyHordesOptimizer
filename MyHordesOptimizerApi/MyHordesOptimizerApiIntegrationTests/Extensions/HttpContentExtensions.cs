using MyHordesOptimizerApi.Extensions;
using System.Net.Mime;
using System.Text;

namespace MyHordesOptimizerApiIntegrationTests.Extensions
{
    public static class HttpContentExtensions
    {
        public static HttpContent ToJsonHttpContent(this object dto)
        {
            var stringBody = dto?.ToJson();
            if (stringBody == null)
            {
                stringBody = string.Empty;
            }
            return new StringContent(stringBody, Encoding.UTF8, MediaTypeNames.Application.Json);
        }
    }
}
