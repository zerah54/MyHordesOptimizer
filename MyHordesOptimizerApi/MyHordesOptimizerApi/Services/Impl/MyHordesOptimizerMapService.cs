using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class MyHordesOptimizerMapService : IMyHordesOptimizerMapService
    {
        protected ILogger<MyHordesOptimizerMapService> Logger { get; private set; }
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }

        public MyHordesOptimizerMapService(ILogger<MyHordesOptimizerMapService> logger,
            IServiceScopeFactory serviceScopeFactory,
            IMapper mapper,
            IUserInfoProvider userInfoProvider)
        {
            Logger = logger;
            ServiceScopeFactory = serviceScopeFactory;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
        }

        public LastUpdateInfoDto UpdateCell(int townId, MyHordesOptimizerCellUpdateDto updateRequest)
        {
            //var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            //var cell = Mapper.Map<MapCell>(updateRequest);
            //cell.IdTown = townId;
            //var lastUpdateInfoId = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
            //cell.IdLastUpdateInfo = lastUpdateInfoId;

            //var cellItems = Mapper.Map<List<MapCellItem>>(updateRequest.Items);

            //var cells = new List<MapCell>() { cell };
            //cells.ForEach(cell => { if (Convert.ToBoolean(cell.IsDryed)) { cell.AveragePotentialRemainingDig = 0; cell.MaxPotentialRemainingDig = 0; } });
            //MyHordesOptimizerRepository.PatchMapCell(townId, cells, forceUpdate: true);

            //MyHordesOptimizerRepository.ClearCellItem(cell.IdCell, lastUpdateInfoId);
            //cellItems.ForEach(cellItem => cellItem.IdCell = cell.IdCell);
            //MyHordesOptimizerRepository.PatchMapCellItem(townId, cellItems);

            //MyHordesOptimizerRepository.UpdateCitizenLocation(cell.IdTown.Value, updateRequest.X, updateRequest.Y, updateRequest.Citizens, lastUpdateInfoId);

            //return lastUpdateInfo;
            return null;

        }
    }
}
