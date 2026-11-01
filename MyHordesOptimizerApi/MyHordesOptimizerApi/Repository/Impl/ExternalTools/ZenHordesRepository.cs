using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.ZenHordes;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using System;
using System.Net.Http;
using System.Net.Mime;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Repository.Impl.ExternalTools
{
    public class ZenHordesRepository : AbstractWebApiRepositoryBase, IZenHordesRepository
    {
        public override string HttpClientName => nameof(ZenHordesRepository);
        protected IZenHordesConfiguration ZenHordesConfiguration { get; private set; }

        private const string EndpointUpdate = "update";

        public ZenHordesRepository(ILogger<ZenHordesRepository> logger,
            IHttpClientFactory httpClientFactory,
            IZenHordesConfiguration zenHordesConfiguration) : base(logger, httpClientFactory)
        {
            ZenHordesConfiguration = zenHordesConfiguration;
        }

        public Task UpdateAsync(ZenHordesUpdateRequestDto updateRequest)
        {
            return Task.Run(() => Update(updateRequest));
        }

        /// <summary>Un 200 portant <c>success: false</c> est un refus de ZenHordes, pas une réussite.</summary>
        private void Update(ZenHordesUpdateRequestDto updateRequest)
        {
            try
            {
                var url = $"{ZenHordesConfiguration.Url}/{EndpointUpdate}";
                var response = Post<ZenHordesUpdateResponseDto>(url: url, body: updateRequest, mediaTypeOut: MediaTypeNames.Application.Json);
                if (!response.Success)
                {
                    throw new MhoTechnicalException($"ZenHordes a refusé la mise à jour : {response.Error}");
                }
            }
            catch (Exception e)
            {
                Logger.LogWarning(e, e.Message);
                throw;
            }
        }
    }
}
