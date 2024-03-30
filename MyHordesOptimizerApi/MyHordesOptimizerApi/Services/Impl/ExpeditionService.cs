using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class ExpeditionService : IExpeditionService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }
        protected ILogger<ExpeditionService> Logger { get; private set; }
        protected MhoContext DbContext { get; init; }

        public ExpeditionService(IServiceScopeFactory serviceScopeFactory,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            ILogger<ExpeditionService> logger,
            MhoContext dbContext)
        {
            ServiceScopeFactory = serviceScopeFactory;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
            DbContext = dbContext;
        }

        public ExpeditionDto SaveExpedition(ExpeditionDto expeditionDto, int idTown, int day)
        {
            using var transaction = DbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            DbContext.SaveChanges();
            var expeditionModel = Mapper.Map<Expedition>(expeditionDto);
            expeditionModel.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            expeditionModel.Day = day;
            expeditionModel.IdTown = idTown;
            ExpeditionDto result;
            if (expeditionDto.Id.HasValue)
            {
                // Update
                var modelFromDb = DbContext.Expeditions.Single(expedition => expedition.IdExpedition == expeditionDto.Id);
                modelFromDb.UpdateAllButKeysProperties(expeditionModel);
                DbContext.Update(modelFromDb);
                result = Mapper.Map<ExpeditionDto>(modelFromDb);
            }
            else
            {
                // Create
                var newEntity = DbContext.Add(expeditionModel);
                DbContext.SaveChanges();
                result = Mapper.Map<ExpeditionDto>(newEntity.Entity);
            }
            DbContext.SaveChanges();
            transaction.Commit();
            return result;
        }

        public List<ExpeditionDto> GetExpeditionsByDay(int townId, int day)
        {
            var models = DbContext.Expeditions.Where(expedition => expedition.IdTown == townId && expedition.Day == day).ToList();
            var dtos = Mapper.Map<List<ExpeditionDto>>(models);
            return dtos;
        }
    }
}
