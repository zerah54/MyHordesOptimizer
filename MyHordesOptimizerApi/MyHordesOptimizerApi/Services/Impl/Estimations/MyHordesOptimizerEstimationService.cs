using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;

namespace MyHordesOptimizerApi.Services.Impl.Estimations
{
    public class MyHordesOptimizerEstimationService : IMyHordesOptimizerEstimationService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }
        protected ILogger<MyHordesOptimizerEstimationService> Logger { get; private set; }
        protected IMapper Mapper { get; private set; }

        public MyHordesOptimizerEstimationService(IServiceScopeFactory serviceScopeFactory, IUserInfoProvider userInfoProvider, ILogger<MyHordesOptimizerEstimationService> logger, IMapper mapper)
        {
            ServiceScopeFactory = serviceScopeFactory;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
            Mapper = mapper;
        }

        public void UpdateEstimations(int townId, EstimationRequestDto request)
        {
            //var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            //var idLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);

            //var estimation = Mapper.Map<TownEstimation>(request.Estim);
            //estimation.Day = request.Day.Value;
            //estimation.IdTown = townId;
            //estimation.IdLastUpdateInfo = idLastUpdateInfo;
            //var planif = Mapper.Map<TownEstimation>(request.Planif);
            //planif.Day = request.Day.Value;
            //planif.IdTown = townId;
            //planif.IdLastUpdateInfo = idLastUpdateInfo;
            //planif.IsPlanif = Convert.ToUInt64(true);

            //MyHordesOptimizerRepository.UpdateEstimation(townId, estimation);
            //MyHordesOptimizerRepository.UpdateEstimation(townId, planif);
        }

        public EstimationRequestDto GetEstimations(int townId, int day)
        {
            //var estimations = MyHordesOptimizerRepository.GetEstimations(townId, day);
            //if (estimations.Any())
            //{
            //    var dto = Mapper.Map<EstimationRequestDto>(estimations);
            //    return dto;
            //}

            //return new EstimationRequestDto()
            //{
            //    Day = day
            //};
            return null;
        }
    }
}
