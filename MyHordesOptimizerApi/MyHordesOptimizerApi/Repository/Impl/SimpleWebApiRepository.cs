using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Repository.Abstract;
using System.Net.Http;

namespace Common.Core.Repository.Impl
{
    public class SimpleWebApiRepository : AbstractWebApiRepositoryBase
    {
        public override string HttpClientName => nameof(SimpleWebApiRepository);

        public SimpleWebApiRepository(ILogger<SimpleWebApiRepository> logger, IHttpClientFactory httpClientFactory) : base(logger, httpClientFactory)
        {
        }
    }
}
