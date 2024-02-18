using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Estimations
{
    public class MyHordesOptimizerEstimationService : IMyHordesOptimizerEstimationService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }
        protected ILogger<MyHordesOptimizerEstimationService> Logger { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected MhoContext DbContext { get; set; }

        public MyHordesOptimizerEstimationService(IServiceScopeFactory serviceScopeFactory,
            IUserInfoProvider userInfoProvider,
            ILogger<MyHordesOptimizerEstimationService> logger,
            IMapper mapper,
            MhoContext dbContext)
        {
            ServiceScopeFactory = serviceScopeFactory;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
            Mapper = mapper;
            DbContext = dbContext;
        }

        public void UpdateEstimations(int townId, EstimationRequestDto request)
        {
            using var transaction = DbContext.Database.BeginTransaction();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(UserInfoProvider.GenerateLastUpdateInfo(), opt => opt.SetDbContext(DbContext)));
            DbContext.SaveChanges();

            var newEstimations = Mapper.Map<List<TownEstimation>>(request, opt =>
            {
                opt.SetLastUpdateInfoId(newLastUpdate.Entity.IdLastUpdateInfo);
                opt.SetTownId(townId);
            });
            var estimations = DbContext.TownEstimations.Where(x => x.Day == request.Day && x.IdTown == townId)
                .ToList();
            if (estimations.Any())
            {
                var planif = estimations.First(e => e.IsPlanif);
                planif.UpdateNoNullProperties(newEstimations.First(ne => ne.IsPlanif));
                DbContext.Update(planif);
                var estim = estimations.First(e => !e.IsPlanif);
                estim.UpdateNoNullProperties(newEstimations.First(ne => !ne.IsPlanif));
                DbContext.Update(estim);
            }
            else
            {
                DbContext.AddRange(newEstimations);
            }            
            DbContext.SaveChanges();
            transaction.Commit();
        }

        public EstimationRequestDto GetEstimations(int townId, int day)
        {
            var models = DbContext.TownEstimations.Where(x => x.Day == day && x.IdTown == townId)
                .ToList();
            var dto = Mapper.Map<EstimationRequestDto>(models);
            return dto;
        }
    }
}
