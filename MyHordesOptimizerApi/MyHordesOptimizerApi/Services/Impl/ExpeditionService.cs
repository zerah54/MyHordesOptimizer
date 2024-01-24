using AutoMapper;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Models.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class ExpeditionService : IExpeditionService
    {
        protected IMyHordesOptimizerRepository MyHordesOptimizerRepository { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }
        protected ILogger<ExpeditionService> Logger { get; private set; }

        public ExpeditionService(IMyHordesOptimizerRepository myHordesOptimizerRepository, IMapper mapper, IUserInfoProvider userInfoProvider, ILogger<ExpeditionService> logger)
        {
            MyHordesOptimizerRepository = myHordesOptimizerRepository;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
        }

        public async Task<ExpeditionDto> SaveAsync(ExpeditionDto expedition, int idTown, int day)
        {
           if(expedition.Id.HasValue)
            {
                // Update
            }
            else
            {
                // Create
                var expeditionLastUpdate = UserInfoProvider.GenerateLastUpdateInfo();
                var lastUpdateId = MyHordesOptimizerRepository.CreateLastUpdateInfo(expeditionLastUpdate);

                var expeditionModel = Mapper.Map<ExpeditionModel>(expedition);
                expeditionModel.IdLastUpdateInfo = lastUpdateId;
                expeditionModel.Day = day;
                expeditionModel.IdTown = idTown;

                var savedExpeditionModel = MyHordesOptimizerRepository.InsertExpedition(expeditionModel);             
            }
        }
    }
}
