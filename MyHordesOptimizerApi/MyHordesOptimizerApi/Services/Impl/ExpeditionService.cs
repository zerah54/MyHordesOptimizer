﻿using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class ExpeditionService : IExpeditionService
    {
        public static SemaphoreSlim Lock = new SemaphoreSlim(1);
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

        #region Expeditions

        public async Task<ExpeditionDto> SaveExpeditionAsync(ExpeditionRequestDto expeditionDto, int idTown, int day)
        {
            await Lock.WaitAsync();
            try
            {
                using var transaction = DbContext.Database.BeginTransaction();
                LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
                var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
                DbContext.SaveChanges();
                var expeditionModel = Mapper.Map<Expedition>(expeditionDto, opt => opt.SetDbContext(DbContext));
                expeditionModel.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
                expeditionModel.Day = day;
                expeditionModel.IdTown = idTown;
                ExpeditionDto result;
                if (expeditionDto.Id.HasValue)
                {
                    // Update
                    var modelFromDb = DbContext.Expeditions
                        .Where(expedition => expedition.IdExpedition == expeditionDto.Id)
                        .Include(expedition => expedition.ExpeditionParts)
                            .ThenInclude(part => part.IdExpeditionOrders)
                        .Include(expedition => expedition.ExpeditionParts)
                            .ThenInclude(part => part.ExpeditionCitizens)
                                .ThenInclude(expeditionCitizen => expeditionCitizen.IdExpeditionBagNavigation)
                                    .ThenInclude(bag => bag.ExpeditionBagItems)
                        .Include(expedition => expedition.ExpeditionParts)
                            .ThenInclude(part => part.ExpeditionCitizens)
                                .ThenInclude(expeditionCitizen => expeditionCitizen.IdExpeditionOrders)
                        .Single();

                    // On récupère les collections de la db
                    var expeditionsOrderFromDb = modelFromDb.ExpeditionParts.SelectMany(part => part.IdExpeditionOrders).ToList();
                    expeditionsOrderFromDb.AddRange(modelFromDb.ExpeditionParts.SelectMany(part => part.ExpeditionCitizens.SelectMany(citizen => citizen.IdExpeditionOrders)));
                    var partFromDb = modelFromDb.ExpeditionParts;
                    var citizenFromDb = modelFromDb.ExpeditionParts.SelectMany(part => part.ExpeditionCitizens).ToList();
                    // On récupère les mêmes collection du model a update
                    var expeditionsOrderFromDto = expeditionModel.ExpeditionParts.SelectMany(part => part.IdExpeditionOrders).ToList();
                    expeditionsOrderFromDto.AddRange(expeditionModel.ExpeditionParts.SelectMany(part => part.ExpeditionCitizens.SelectMany(citizen => citizen.IdExpeditionOrders)));
                    var partFromDto = expeditionModel.ExpeditionParts;
                    var citizenFromDto = expeditionModel.ExpeditionParts.SelectMany(part => part.ExpeditionCitizens).ToList();
                    // On patch les collections
                    DbContext.Patch(expeditionsOrderFromDb, expeditionsOrderFromDto);
                    DbContext.Patch(partFromDb, partFromDto);
                    DbContext.Patch(citizenFromDb, citizenFromDto);

                    modelFromDb.UpdateAllButKeysProperties(expeditionModel);
                    DbContext.Update(modelFromDb);
                    DbContext.SaveChanges();
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
            catch (System.Exception)
            {
                throw;
            }
            finally
            {
                Lock.Release();
            }
        }

        public List<ExpeditionDto> GetExpeditionsByDay(int townId, int day)
        {
            var models = DbContext.Expeditions
                .Where(expedition => expedition.IdTown == townId && expedition.Day == day)
                .Include(expedition => expedition.ExpeditionParts)
                    .ThenInclude(part => part.IdExpeditionOrders)
                .Include(expedition => expedition.ExpeditionParts)
                    .ThenInclude(part => part.ExpeditionCitizens)
                       .ThenInclude(expeditionCitizen => expeditionCitizen.IdExpeditionBagNavigation)
                         .ThenInclude(bag => bag.ExpeditionBagItems)
                .Include(expedition => expedition.ExpeditionParts)
                    .ThenInclude(part => part.ExpeditionCitizens)
                        .ThenInclude(expeditionCitizen => expeditionCitizen.IdExpeditionOrders)
                .ToList();
            var dtos = Mapper.Map<List<ExpeditionDto>>(models);
            return dtos;
        }

        public void DeleteExpedition(int expeditionId)
        {
            var expedition = DbContext.Expeditions.Single(expedition => expedition.IdExpedition == expeditionId);
            DbContext.Remove(expedition);
            DbContext.SaveChanges();
        }

        #endregion

        #region ExpeditionCitizen

        public async Task<ExpeditionCitizenDto> SaveExpeditionCitizenAsync(int expeditionPartId, ExpeditionCitizenRequestDto expeditionCitizen)
        {
            using var transaction = DbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            DbContext.SaveChanges();
            var expeditionCitizenModel = Mapper.Map<ExpeditionCitizen>(expeditionCitizen, opt => opt.SetDbContext(DbContext));
            expeditionCitizenModel.IdExpeditionPart = expeditionPartId;
            ExpeditionCitizenDto result;
            if (expeditionCitizen.Id.HasValue)
            {
                // Update
                var expeditionCitizenFromDb = DbContext.ExpeditionCitizens.Where(citizen => citizen.IdExpeditionCitizen == expeditionCitizen.Id.Value)
                    .Include(citizen => citizen.IdExpeditionOrders)
                    .Include(citizen => citizen.IdExpeditionBagNavigation)
                    .Single();

                var orderFromDb = expeditionCitizenFromDb.IdExpeditionOrders;
                var orderFromDto = expeditionCitizenModel.IdExpeditionOrders;
                DbContext.Patch(orderFromDb, orderFromDto);

                expeditionCitizenFromDb.UpdateAllButKeysProperties(expeditionCitizenModel);
                DbContext.SaveChanges();
                result = Mapper.Map<ExpeditionCitizenDto>(expeditionCitizenFromDb);
            }
            else
            {
                // Create
                var newEntity = DbContext.Add(expeditionCitizenModel);
                DbContext.SaveChanges();
                result = Mapper.Map<ExpeditionCitizenDto>(newEntity.Entity);
            }
            transaction.Commit();
            return result;
        }

        public void DeleteExpeditionCitizen(int expeditionCitizenId)
        {
            var expeditionCitizen = DbContext.ExpeditionCitizens.Single(expedition => expedition.IdExpeditionCitizen == expeditionCitizenId);
            DbContext.Remove(expeditionCitizen);
            DbContext.SaveChanges();
        }

        #endregion

        #region ExpeditionParts

        public Task<ExpeditionPartDto> SaveExpeditionPartAsync(int expeditionId, ExpeditionPartRequestDto expeditionPart)
        {
            using var transaction = DbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            DbContext.SaveChanges();
            var expeditionPartModel = Mapper.Map<ExpeditionPart>(expeditionPart, opt => opt.SetDbContext(DbContext));
            expeditionPartModel.IdExpedition = expeditionId;
            ExpeditionPartDto result;
            if (expeditionPart.Id.HasValue)
            {
                // Update
                var expeditionPartFromDb = DbContext.ExpeditionParts.Where(part => part.IdExpeditionPart == expeditionPart.Id.Value)
                    .Include(part => part.IdExpeditionOrders)
                    .Include(part => part.ExpeditionCitizens)
                        .ThenInclude(citizen => citizen.IdExpeditionOrders)
                    .Include(part => part.ExpeditionCitizens)
                        .ThenInclude(citizen => citizen.IdExpeditionBagNavigation)
                    .Single();

                // On récupère les collections de la db
                var orderFromDb = expeditionPartFromDb.IdExpeditionOrders.ToList();
                orderFromDb.AddRange(expeditionPartFromDb.ExpeditionCitizens.SelectMany(citizen => citizen.IdExpeditionOrders));
                var citizenFromDb = expeditionPartFromDb.ExpeditionCitizens;
                // On récupère les mêmes collection du model a update
                var orderFromModel = expeditionPartModel.IdExpeditionOrders.ToList();
                orderFromModel.AddRange(expeditionPartModel.ExpeditionCitizens.SelectMany(citizen => citizen.IdExpeditionOrders));
                var citizenFromModel = expeditionPartModel.ExpeditionCitizens;
                // On patch les collections
                DbContext.Patch(orderFromDb, orderFromModel);
                DbContext.Patch(citizenFromDb, citizenFromModel);

                expeditionPartFromDb.UpdateAllButKeysProperties(expeditionPartModel);
                DbContext.SaveChanges();
                result = Mapper.Map<ExpeditionPartDto>(expeditionPartFromDb);
            }
            else
            {
                // Create
                var newEntity = DbContext.Add(expeditionPartModel);
                DbContext.SaveChanges();
                result = Mapper.Map<ExpeditionPartDto>(newEntity.Entity);
            }
            transaction.Commit();
            return Task.FromResult(result);
        }

        public void DeleteExpeditionPart(int expeditionPartId)
        {
            var expeditionPart = DbContext.ExpeditionParts.Single(part => part.IdExpeditionPart == expeditionPartId);
            DbContext.Remove(expeditionPart);
            DbContext.SaveChanges();
        }

        #endregion
    }
}