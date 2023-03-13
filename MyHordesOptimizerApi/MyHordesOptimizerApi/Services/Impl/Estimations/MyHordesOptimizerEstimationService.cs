using AutoMapper;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Models.Estimations;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Estimations
{
    public class MyHordesOptimizerEstimationService : IMyHordesOptimizerEstimationService
    {
        protected IMyHordesOptimizerRepository MyHordesOptimizerRepository { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }
        protected ILogger<MyHordesOptimizerEstimationService> Logger { get; private set; }
        protected IMapper Mapper { get; private set; }

        public MyHordesOptimizerEstimationService(IMyHordesOptimizerRepository myHordesOptimizerRepository, IUserInfoProvider userInfoProvider, ILogger<MyHordesOptimizerEstimationService> logger, IMapper mapper)
        {
            MyHordesOptimizerRepository = myHordesOptimizerRepository;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
            Mapper = mapper;
        }

        public void UpdateEstimations(int townId, EstimationRequestDto request)
        {
            var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            var idLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);

            var estimation = Mapper.Map<TownEstimationModel>(request.Estim);
            estimation.Day = request.Day.Value;
            estimation.IdTown = townId;
            estimation.IdLastUpdateInfo = idLastUpdateInfo;
            var planif = Mapper.Map<TownEstimationModel>(request.Planif);
            planif.Day = request.Day.Value;
            planif.IdTown = townId;
            planif.IdLastUpdateInfo = idLastUpdateInfo;
            planif.IsPlanif = true;

            MyHordesOptimizerRepository.UpdateEstimation(townId, estimation);
            MyHordesOptimizerRepository.UpdateEstimation(townId, planif);
        }

        public EstimationRequestDto GetEstimations(int townId, int day)
        {
            var estimations = MyHordesOptimizerRepository.GetEstimations(townId, day);
            var hihi = estimations.First(x => !x.IsPlanif);
            var hoho = hihi._0Min.HasValue && hihi._0Max.HasValue;
            var dto = Mapper.Map<EstimationRequestDto>(estimations);
            return dto;
        }
    }
}
