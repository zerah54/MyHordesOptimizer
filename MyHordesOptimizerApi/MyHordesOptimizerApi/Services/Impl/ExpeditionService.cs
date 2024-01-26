using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class ExpeditionService : IExpeditionService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }
        protected ILogger<ExpeditionService> Logger { get; private set; }

        public ExpeditionService(IServiceScopeFactory serviceScopeFactory, IMapper mapper, IUserInfoProvider userInfoProvider, ILogger<ExpeditionService> logger)
        {
            ServiceScopeFactory = serviceScopeFactory;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
        }

        public async Task<ExpeditionDto> SaveAsync(ExpeditionDto expedition, int idTown, int day)
        {
            //if (expedition.Id.HasValue)
            //{
            //    // Update
            //}
            //else
            //{
            //    // Create
            //    var expeditionLastUpdate = UserInfoProvider.GenerateLastUpdateInfo();
            //    var lastUpdateId = MyHordesOptimizerRepository.CreateLastUpdateInfo(expeditionLastUpdate);

            //    var expeditionModel = Mapper.Map<Expedition>(expedition);
            //    expeditionModel.IdLastUpdateInfo = lastUpdateId;
            //    expeditionModel.Day = day;
            //    expeditionModel.IdTown = idTown;

            //    var savedExpeditionModel = MyHordesOptimizerRepository.InsertExpedition(expeditionModel);
            //}
            return null;
        }
    }
}
