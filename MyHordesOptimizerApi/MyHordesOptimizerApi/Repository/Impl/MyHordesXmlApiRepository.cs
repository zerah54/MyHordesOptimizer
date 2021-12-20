using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces;
using System.Net.Http;
using System.Net.Mime;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class MyHordesXmlApiRepository : AbstractMyHordeRepositoryBase, IMyHordesXmlApiRepository
    {
        public override string HttpClientName => nameof(MyHordesXmlApiRepository);

        protected override string BaseEndpoint => "v2/xml";

        public MyHordesXmlApiRepository(ILogger<MyHordesXmlApiRepository> logger,
            IHttpClientFactory httpClientFactory,
            IMyHordesApiConfiguration myHordesApiConfiguration,
            IUserKeyProvider userKeyProvider) : base(logger, httpClientFactory, myHordesApiConfiguration, userKeyProvider)
        {
        }

        public MyHordesRootElementDto GetItems()
        {
            string url = GenerateUrl(EndpointItems);
            return base.Get<MyHordesRootElementDto>(url, mediaTypeOut: MediaTypeNames.Application.Xml);
        }
    }
}
