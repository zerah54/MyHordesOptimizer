using AutoMapper;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Models.Map;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class MyHordesOptimizerMapService : IMyHordesOptimizerMapService
    {
        protected ILogger<MyHordesOptimizerMapService> Logger { get; private set; }
        protected IMyHordesOptimizerRepository MyHordesOptimizerRepository { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }

        public MyHordesOptimizerMapService(ILogger<MyHordesOptimizerMapService> logger, IMyHordesOptimizerRepository myHordesOptimizerRepository, IMapper mapper, IUserInfoProvider userInfoProvider)
        {
            Logger = logger;
            MyHordesOptimizerRepository = myHordesOptimizerRepository;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
        }

        public LastUpdateInfo UpdateCell(int townId, MyHordesOptimizerCellUpdateDto updateRequest)
        {
            var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            var cell = Mapper.Map<MapCellModel>(updateRequest);
            cell.IdTown = townId;
            var lastUpdateInfoId = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
            cell.IdLastUpdateInfo = lastUpdateInfoId;

            var cellItems = Mapper.Map<List<MapCellItemModel>>(updateRequest.Items);

            var cells = new List<MapCellModel>() { cell };
            MyHordesOptimizerRepository.PatchMapCell(townId, cells, forceUpdate: true);

            MyHordesOptimizerRepository.ClearCellItem(cell.IdCell, lastUpdateInfoId);
            cellItems.ForEach(cellItem => cellItem.IdCell = cell.IdCell);
            MyHordesOptimizerRepository.PatchMapCellItem(townId, cellItems);

            MyHordesOptimizerRepository.UpdateCitizenLocation(cell.IdTown, updateRequest.X, updateRequest.Y, updateRequest.Citizens, lastUpdateInfoId);

            return lastUpdateInfo;

        }
    }
}
