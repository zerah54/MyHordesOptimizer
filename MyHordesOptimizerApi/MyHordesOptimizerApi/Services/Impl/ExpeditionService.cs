using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Extensions.Models.Expeditions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Expeditions;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
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
                    // UpdateAsync
                    var modelFromDb = DbContext.Expeditions
                        .Where(expedition => expedition.IdExpedition == expeditionDto.Id)
                        .Include(expedition => expedition.ExpeditionParts)
                            .ThenInclude(part => part.IdExpeditionOrders)
                        .Include(expedition => expedition.ExpeditionParts)
                            .ThenInclude(part => part.ExpeditionCitizens)
                                .ThenInclude(expeditionCitizen => expeditionCitizen.IdExpeditionBagNavigation)
                                    .ThenInclude(bag => bag.ExpeditionBagItems)
                                        .ThenInclude(bagItem => bagItem.IdItemNavigation)
                        .Include(expedition => expedition.ExpeditionParts)
                            .ThenInclude(part => part.ExpeditionCitizens)
                                .ThenInclude(expeditionCitizen => expeditionCitizen.ExpeditionOrders)
                        .Single();

                    // On récupère les collections de la db
                    var expeditionsOrderFromDb = modelFromDb.ExpeditionParts.SelectMany(part => part.IdExpeditionOrders).ToList();
                    expeditionsOrderFromDb.AddRange(modelFromDb.ExpeditionParts.SelectMany(part => part.ExpeditionCitizens.SelectMany(citizen => citizen.ExpeditionOrders)));
                    var partFromDb = modelFromDb.ExpeditionParts;
                    var citizenFromDb = modelFromDb.ExpeditionParts.SelectMany(part => part.ExpeditionCitizens).ToList();
                    // On récupère les mêmes collection du model a update
                    var expeditionsOrderFromDto = expeditionModel.ExpeditionParts.SelectMany(part => part.IdExpeditionOrders).ToList();
                    expeditionsOrderFromDto.AddRange(expeditionModel.ExpeditionParts.SelectMany(part => part.ExpeditionCitizens.SelectMany(citizen => citizen.ExpeditionOrders)));
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
            var models = DbContext.Expeditions.Where(expedition => expedition.IdTown == townId && expedition.Day == day)
                .IncludeAll()
                .ToList();
            var dtos = Mapper.Map<List<ExpeditionDto>>(models);
            return dtos;
        }

        public List<ExpeditionDto> GetUserExpeditionsByDay(int townId, int userId, int day)
        {
            var models = DbContext.Expeditions.Where(expedition => expedition.IdTown == townId && expedition.Day == day)
                .Where(expedition => expedition.ExpeditionParts.Any(part => part.ExpeditionCitizens.Any(citizen => citizen.IdUser == userId)))
                .IncludeAll()
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

        public async Task<List<ExpeditionDto>> CopyExpeditionsAsync(int townId, int fromDay, int targetDay)
        {
            await Lock.WaitAsync();
            try
            {
                using var transaction = DbContext.Database.BeginTransaction();
                LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
                var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
                DbContext.SaveChanges();
                var modelsFromDb = DbContext.Expeditions
                               .Where(expedition => expedition.IdTown == townId && expedition.Day == fromDay)
                               .Include(expedition => expedition.ExpeditionParts)
                                   .ThenInclude(part => part.IdExpeditionOrders)
                               .Include(expedition => expedition.ExpeditionParts)
                                   .ThenInclude(part => part.ExpeditionCitizens)
                                       .ThenInclude(expeditionCitizen => expeditionCitizen.IdExpeditionBagNavigation)
                                           .ThenInclude(bag => bag.ExpeditionBagItems)
                                                .ThenInclude(bagItem => bagItem.IdItemNavigation)
                               .Include(expedition => expedition.ExpeditionParts)
                                   .ThenInclude(part => part.ExpeditionCitizens)
                                       .ThenInclude(expeditionCitizen => expeditionCitizen.ExpeditionOrders)
                               .ToList();

                var existingExpeditionToDelete = DbContext.Expeditions.Where(expedition => expedition.IdTown == townId && expedition.Day == targetDay);
                DbContext.RemoveRange(existingExpeditionToDelete);
                var newExpeditions = new List<Expedition>();
                foreach (var modelFromDb in modelsFromDb)
                {
                    var newExpedtion = modelFromDb.Copy();
                    newExpedtion.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
                    newExpedtion.Day = targetDay;
                    newExpedtion.State = ExpeditionConstants.ExpeditionStateStop;
                    var updatedNewExpedition = DbContext.Add(newExpedtion).Entity;
                    DbContext.SaveChanges();
                    newExpeditions.Add(updatedNewExpedition);
                }
                DbContext.SaveChanges();
                transaction.Commit();
                var returnedDto = Mapper.Map<List<ExpeditionDto>>(newExpeditions);
                return returnedDto;
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {
                Lock.Release();
            }
        }

        public ExpeditionInhorenceModel ValidateExpeditions(int townId, int day)
        {
            var expeditions = DbContext.GetTownExpeditionsByDay(townId, day)
                .Include(expedition => expedition.ExpeditionParts)
                    .ThenInclude(part => part.ExpeditionCitizens)
                        .ThenInclude(expeditionCitizen => expeditionCitizen.IdExpeditionBagNavigation)
                            .ThenInclude(bag => bag.ExpeditionBagItems)
                                .ThenInclude(bagItem => bagItem.IdItemNavigation)
                                    .ThenInclude(item => item.ActionNames)
                                    .AsSplitQuery()
                .Include(expedition => expedition.ExpeditionParts)
                    .ThenInclude(part => part.ExpeditionCitizens)
                        .ThenInclude(expeditionCitizen => expeditionCitizen.IdExpeditionBagNavigation)
                            .ThenInclude(bag => bag.ExpeditionBagItems)
                                .ThenInclude(bagItem => bagItem.IdItemNavigation)
                                    .ThenInclude(item => item.PropertyNames)
                                    .AsSplitQuery()
                .ToList();
            var townExpeditionIncoherences = new List<TownExpeditionIncoherenceModel>();
            var partIncoherences = new List<ExpeditionPartIncoherenceModel>();
            var citizenIncoherences = new List<ExpeditionCitizenIncoherenceModel>();
            var expeditionIdForCitizenId = new Dictionary<int, List<int>>();
            foreach (var expedition in expeditions)
            {
                foreach (var part in expedition.ExpeditionParts)
                {
                    // Si la somme des PDC de la part est < au nombre de PDC min
                    if (part.ExpeditionCitizens.ToList().Sum(expeditionCitizen => expeditionCitizen.Pdc) < expedition.MinPdc)
                    {
                        partIncoherences.Add(new ExpeditionPartIncoherenceModel(part.IdExpeditionPart, ExpeditionPartIncoherenceType.NotEnoughPdc));
                    }
                    var hasSportElec = false;
                    var nbBandage = 0;
                    var citizenPa = -1;
                    foreach (var citizen in part.ExpeditionCitizens)
                    {
                        if (citizen.IdUser is not null)
                        {
                            if (!expeditionIdForCitizenId.TryGetValue(citizen.IdUser.Value, out var registerExpedition))
                            {
                                registerExpedition = new List<int>();
                            }
                            if (!registerExpedition.Contains(expedition.IdExpedition))
                            {
                                registerExpedition.Add(expedition.IdExpedition);
                            }
                            expeditionIdForCitizenId[citizen.IdUser.Value] = registerExpedition;
                            if (registerExpedition.Count > 1) // si l'utilisateur est déjà inscrit sur une autre expé
                            {
                                citizenIncoherences.Add(new ExpeditionCitizenIncoherenceModel(citizen.IdExpeditionCitizen, ExpeditionCitizenIncoherenceType.CitizenAlreadyRegister));
                            }
                            var townCitizen = DbContext.TownCitizens.Single(townCitizen => townCitizen.IdUser == citizen.IdUser && townCitizen.IdTown == townId);
                            // Vérification des pouvoirs héroic
                            switch (citizen.PreinscritHeroic)
                            {
                                case "hero_generic_ap":
                                    if (townCitizen.HasSecondWind != true)
                                    {
                                        citizenIncoherences.Add(new ExpeditionCitizenIncoherenceModel(citizen.IdExpeditionCitizen, ExpeditionCitizenIncoherenceType.CitizenHasNoSecondWind));
                                    }
                                    break;
                                case "hero_generic_punch":
                                    if (townCitizen.HasUppercut != true)
                                    {
                                        citizenIncoherences.Add(new ExpeditionCitizenIncoherenceModel(citizen.IdExpeditionCitizen, ExpeditionCitizenIncoherenceType.CitizenHasNoUppercut));
                                    }
                                    break;
                                case "hero_generic_rescue":
                                    if (townCitizen.HasRescue != true)
                                    {
                                        citizenIncoherences.Add(new ExpeditionCitizenIncoherenceModel(citizen.IdExpeditionCitizen, ExpeditionCitizenIncoherenceType.CitizenHasNoRescue));
                                    }
                                    break;
                                case "hero_generic_return":
                                    if (townCitizen.HasHeroicReturn != true)
                                    {
                                        citizenIncoherences.Add(new ExpeditionCitizenIncoherenceModel(citizen.IdExpeditionCitizen, ExpeditionCitizenIncoherenceType.CitizenHasNoHeroicReturn));
                                    }
                                    break;
                            }
                        }
                        if (citizen.IdExpeditionBagNavigation is not null)
                        {
                            var nbAlcool = 0;
                            var nbDrug = 0;
                            var nbWater = 0;
                            var nbFood = 0;
                            var totalPaCitizen = 6;
                            foreach (var item in citizen.IdExpeditionBagNavigation.ExpeditionBagItems)
                            {
                                if (item.IdItemNavigation.ActionNames.Any(action => action.Name == "eat_6ap"))
                                {
                                    nbFood++;
                                    if (nbFood == 1)
                                    {
                                        totalPaCitizen += 6;
                                    }
                                }
                                if (item.IdItemNavigation.ActionNames.Any(action => action.Name == "eat_7ap"))
                                {
                                    nbFood++;
                                    if (nbFood == 1)
                                    {
                                        totalPaCitizen += 7;
                                    }

                                }
                                if (item.IdItemNavigation.PropertyNames.Any(property => property.Name == "is_water"))
                                {
                                    nbWater++;
                                    if (nbWater == 1)
                                    {
                                        totalPaCitizen += 6;
                                    }
                                }
                                if (item.IdItemNavigation.ActionNames.Any(action => action.Name == "emt" || action.Name == "load_emt")) // Sport elec
                                {
                                    hasSportElec = true;
                                }
                                if (item.IdItemNavigation.ActionNames.Any(action => action.Name == "drug_6ap_1"))
                                {
                                    nbDrug++;
                                    if (nbDrug == 1)
                                    {
                                        totalPaCitizen += 6;
                                    }
                                }
                                if (item.IdItemNavigation.ActionNames.Any(action => action.Name == "drug_8ap_1"))
                                {
                                    nbDrug++;
                                    if (nbDrug == 1)
                                    {
                                        totalPaCitizen += 8;
                                    }
                                }
                                if (item.IdItemNavigation.ActionNames.Any(action => action.Name == "coffee"))
                                {
                                    totalPaCitizen += 4;
                                }
                                if (item.IdItemNavigation.ActionNames.Any(action => action.Name == "alcohol"))
                                {
                                    nbAlcool++;
                                    if (nbAlcool == 1)
                                    {
                                        totalPaCitizen += 6;
                                    }
                                }
                                if (item.IdItemNavigation.ActionNames.Any(action => action.Name == "bandage"))
                                {
                                    nbBandage++;
                                }
                                if (item.IdItemNavigation.ActionNames.Any(action => action.Name == "alcohol_dx"))
                                {
                                    totalPaCitizen += 6;
                                }
                            }
                            if (hasSportElec)
                            {
                                totalPaCitizen += 5;
                            }
                            if (citizen.NombrePaDepart == 7 && totalPaCitizen >= 21) // Départ 7 pa + boosté twino
                            {
                                citizenIncoherences.Add(new ExpeditionCitizenIncoherenceModel(citizen.IdExpeditionCitizen, ExpeditionCitizenIncoherenceType.CitizenWillComeBackDehidrated));
                            }
                            if (citizen.IsThirsty == true && totalPaCitizen > 21) // soif plus boosté twino
                            {
                                citizenIncoherences.Add(new ExpeditionCitizenIncoherenceModel(citizen.IdExpeditionCitizen, ExpeditionCitizenIncoherenceType.CitizenWillComeBackDehidrated));
                            }
                            if (citizen.IsThirsty == false && totalPaCitizen > 32) // Pas soif + expé de plus de 32pa
                            {
                                citizenIncoherences.Add(new ExpeditionCitizenIncoherenceModel(citizen.IdExpeditionCitizen, ExpeditionCitizenIncoherenceType.CitizenWillComeBackDehidrated));
                            }
                            if (nbAlcool > 1) // Trop d'alcool
                            {
                                citizenIncoherences.Add(new ExpeditionCitizenIncoherenceModel(citizen.IdExpeditionCitizen, ExpeditionCitizenIncoherenceType.HasMoreThanOneAlcool));
                            }
                            if (citizenPa == -1)
                            {
                                citizenPa = totalPaCitizen;
                            }
                            if (citizenPa != totalPaCitizen)
                            {
                                citizenIncoherences.Add(new ExpeditionCitizenIncoherenceModel(citizen.IdExpeditionCitizen, ExpeditionCitizenIncoherenceType.CitizenHasNotSamePaHasOtherCitizen));
                            }
                        }
                    }
                    if (hasSportElec && nbBandage < part.ExpeditionCitizens.Count)
                    {
                        partIncoherences.Add(new ExpeditionPartIncoherenceModel(part.IdExpeditionPart, ExpeditionPartIncoherenceType.NotEnoughBandage));
                    }
                }
            }
            var nbAliveCitizen = DbContext.TownCitizens.Count(townCitizen => townCitizen.IdTown == townId);
            if (expeditions.Sum(expe => expe.ExpeditionParts.Max(part => part.ExpeditionCitizens.Count)) > nbAliveCitizen)
            {
                townExpeditionIncoherences.Add(new TownExpeditionIncoherenceModel(townId, day, TownExpeditionIncoherenceType.TooMuchExpedition));
            }
            if (expeditions.Sum(expe => expe.ExpeditionParts.Max(part => part.ExpeditionCitizens.Count)) < nbAliveCitizen)
            {
                townExpeditionIncoherences.Add(new TownExpeditionIncoherenceModel(townId, day, TownExpeditionIncoherenceType.NotEnoughExpedition));
            }
            return new ExpeditionInhorenceModel(townExpeditionIncoherences, citizenIncoherences, partIncoherences);
        }
        #endregion

        #region ExpeditionCitizen

        public async Task<ExpeditionCitizenDto> SaveExpeditionCitizenAsync(int expeditionPartId, ExpeditionCitizenRequestDto expeditionCitizen)
        {
            await Lock.WaitAsync();
            try
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
                    // UpdateAsync
                    var expeditionCitizenFromDb = DbContext.ExpeditionCitizens.Where(citizen => citizen.IdExpeditionCitizen == expeditionCitizen.Id.Value)
                        .IncludeAll()
                        .Single();

                    var orderFromDb = expeditionCitizenFromDb.ExpeditionOrders;
                    var orderFromDto = expeditionCitizenModel.ExpeditionOrders;
                    DbContext.Patch(orderFromDb, orderFromDto);

                    var part = expeditionCitizenFromDb.IdExpeditionPartNavigation;
                    expeditionCitizenFromDb.UpdateAllButKeysProperties(expeditionCitizenModel);
                    expeditionCitizenFromDb.IdExpeditionPartNavigation = part;
                    expeditionCitizenFromDb.IdExpeditionPart = part.IdExpeditionPart;
                    DbContext.SaveChanges();
                    result = Mapper.Map<ExpeditionCitizenDto>(expeditionCitizenFromDb);
                }
                else
                {
                    // Create
                    if (expeditionCitizenModel.IdExpeditionBagNavigation is null)
                    {
                        expeditionCitizenModel.IdExpeditionBagNavigation = new ExpeditionBag();
                    }
                    var newEntity = DbContext.Add(expeditionCitizenModel).Entity;
                    DbContext.SaveChanges();
                    var expeditionCitizenFromDb = DbContext.ExpeditionCitizens.Where(citizen => citizen.IdExpeditionCitizen == newEntity.IdExpeditionCitizen)
                      .IncludeAll()
                      .Single();
                    result = Mapper.Map<ExpeditionCitizenDto>(expeditionCitizenFromDb);
                }
                transaction.Commit();
                return result;
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {
                Lock.Release();
            }
        }

        public void DeleteExpeditionCitizen(int expeditionCitizenId)
        {
            var expeditionCitizen = DbContext.ExpeditionCitizens.Single(expedition => expedition.IdExpeditionCitizen == expeditionCitizenId);
            DbContext.Remove(expeditionCitizen);
            DbContext.SaveChanges();
        }

        #endregion

        #region ExpeditionParts

        public async Task<ExpeditionPartDto> SaveExpeditionPartAsync(int expeditionId, ExpeditionPartRequestDto expeditionPart)
        {
            await Lock.WaitAsync();
            try
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
                    // UpdateAsync
                    var expeditionPartFromDb = DbContext.ExpeditionParts.Where(part => part.IdExpeditionPart == expeditionPart.Id.Value)
                        .Include(part => part.IdExpeditionOrders)
                        .Include(part => part.ExpeditionCitizens)
                            .ThenInclude(citizen => citizen.ExpeditionOrders)
                        .Include(part => part.ExpeditionCitizens)
                            .ThenInclude(citizen => citizen.IdExpeditionBagNavigation)
                                .ThenInclude(bag => bag.ExpeditionBagItems)
                                    .ThenInclude(bagItem => bagItem.IdItemNavigation)
                        .Single();

                    // On récupère les collections de la db
                    var orderFromDb = expeditionPartFromDb.IdExpeditionOrders.ToList();
                    orderFromDb.AddRange(expeditionPartFromDb.ExpeditionCitizens.SelectMany(citizen => citizen.ExpeditionOrders));
                    var citizenFromDb = expeditionPartFromDb.ExpeditionCitizens;
                    // On récupère les mêmes collection du model a update
                    var orderFromModel = expeditionPartModel.IdExpeditionOrders.ToList();
                    orderFromModel.AddRange(expeditionPartModel.ExpeditionCitizens.SelectMany(citizen => citizen.ExpeditionOrders));
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

        public void DeleteExpeditionPart(int expeditionPartId)
        {
            var expeditionPart = DbContext.ExpeditionParts.Single(part => part.IdExpeditionPart == expeditionPartId);
            DbContext.Remove(expeditionPart);
            DbContext.SaveChanges();
        }

        #endregion

        #region Orders

        public async Task<List<ExpeditionOrderDto>> SaveCitizenOrdersAsync(int expeditionCitizenId, List<ExpeditionOrderDto> expeditionOrder)
        {
            await Lock.WaitAsync();
            try
            {
                using var transaction = DbContext.Database.BeginTransaction();
                LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
                var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
                DbContext.SaveChanges();
                var expeditionCitizen = DbContext.ExpeditionCitizens
                    .Where(citizen => citizen.IdExpeditionCitizen == expeditionCitizenId)
                    .Include(citizen => citizen.ExpeditionOrders)
                    .Include(citizen => citizen.IdExpeditionPartNavigation)
                    .Single();
                var toAdd = expeditionOrder.Where(orderDto => orderDto.Id is null);
                var toUpdate = expeditionOrder.Where(orderDto => orderDto.Id is not null);
                var orderModels = new List<ExpeditionOrder>();
                foreach (var orderDto in toAdd)
                {
                    var orderModel = Mapper.Map<ExpeditionOrder>(orderDto);
                    orderModel.IdExpeditionCitizen = expeditionCitizenId;
                    // Create
                    var newEntity = DbContext.Add(orderModel);
                    DbContext.SaveChanges();
                    var result = newEntity.Entity;
                    orderModels.Add(result);
                }
                foreach (var orderDto in toUpdate)
                {
                    // UpdateAsync
                    var expeditionOrderFromDb = DbContext.ExpeditionOrders
                        .Where(order => order.IdExpeditionOrder == orderDto.Id)
                        .Single();
                    var orderModel = Mapper.Map<ExpeditionOrder>(orderDto);
                    orderModel.IdExpeditionCitizen = expeditionCitizenId;
                    orderModel.IdExpeditionCitizenNavigation = expeditionCitizen;
                    expeditionOrderFromDb.UpdateAllButKeysProperties(orderModel);
                    DbContext.SaveChanges();
                    orderModels.Add(expeditionOrderFromDb);
                }
                var orderFromDb = expeditionCitizen.ExpeditionOrders.ToList();
                var toRemove = orderFromDb.Except(orderModels, EqualityComparerFactory.CreateDefault<ExpeditionOrder>());
                DbContext.RemoveRange(toRemove);
                DbContext.SaveChanges();
                transaction.Commit();
                var results = Mapper.Map<List<ExpeditionOrderDto>>(orderModels);
                return results;
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {
                Lock.Release();
            }
        }

        public async Task<List<ExpeditionOrderDto>> SavePartOrdersAsync(int expeditionPartId, List<ExpeditionOrderDto> expeditionOrder)
        {
            await Lock.WaitAsync();
            try
            {
                using var transaction = DbContext.Database.BeginTransaction();
                LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
                var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
                DbContext.SaveChanges();
                var expeditionPart = DbContext.ExpeditionParts
                    .Where(part => part.IdExpeditionPart == expeditionPartId)
                    .Include(part => part.IdExpeditionOrders)
                    .Single();
                var initialOrderFromDb = expeditionPart.IdExpeditionOrders.ToList();
                var toAdd = expeditionOrder.Where(orderDto => orderDto.Id is null);
                var toUpdate = expeditionOrder.Where(orderDto => orderDto.Id is not null);
                var orderModels = new List<ExpeditionOrder>();
                foreach (var orderDto in toAdd)
                {
                    var orderModel = Mapper.Map<ExpeditionOrder>(orderDto);
                    // Create
                    var newEntity = DbContext.Add(orderModel);
                    DbContext.SaveChanges();
                    var result = newEntity.Entity;
                    orderModels.Add(result);
                }
                foreach (var orderDto in toUpdate)
                {
                    // UpdateAsync
                    var expeditionOrderFromDb = DbContext.ExpeditionOrders.Where(order => order.IdExpeditionOrder == orderDto.Id)
                        .Single();
                    var orderModel = Mapper.Map<ExpeditionOrder>(orderDto);
                    expeditionOrderFromDb.UpdateAllButKeysProperties(orderModel);
                    DbContext.SaveChanges();
                    orderModels.Add(expeditionOrderFromDb);
                }
                var toRemove = initialOrderFromDb.Except(orderModels, EqualityComparerFactory.CreateDefault<ExpeditionOrder>());
                DbContext.RemoveRange(toRemove);
                expeditionPart.IdExpeditionOrders = orderModels;
                DbContext.SaveChanges();
                transaction.Commit();
                var results = Mapper.Map<List<ExpeditionOrderDto>>(orderModels);
                return results;
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {
                Lock.Release();
            }
        }

        public void DeleteExpeditionOrder(int expeditionOrderId)
        {
            var expeditionOrder = DbContext.ExpeditionOrders.Single(order => order.IdExpeditionOrder == expeditionOrderId);
            DbContext.Remove(expeditionOrder);
            DbContext.SaveChanges();
        }

        public ExpeditionOrderDto UpdateExpeditionOrder(ExpeditionOrderDto expeditionOrderDto)
        {
            var expeditionOrderModel = DbContext.ExpeditionOrders
                .Include(order => order.IdExpeditionCitizenNavigation)
                    .ThenInclude(citizen => citizen.IdExpeditionPartNavigation)
                        .ThenInclude(part => part.IdExpeditionNavigation)
                .Include(order => order.IdExpeditionParts)
                    .ThenInclude(part => part.IdExpeditionNavigation)
                .Single(order => order.IdExpeditionOrder == expeditionOrderDto.Id.Value);
            var modelFromDto = Mapper.Map<ExpeditionOrder>(expeditionOrderDto);
            expeditionOrderModel.UpdateAllButKeysProperties(modelFromDto, ignoreNull: true);
            DbContext.Update(expeditionOrderModel);
            DbContext.SaveChanges();
            var returnedDto = Mapper.Map<ExpeditionOrderDto>(expeditionOrderModel);
            return returnedDto;
        }

        #endregion

        #region Bags
        public ExpeditionBagDto UpdateExpeditionBag(int citizenId, ExpeditionBagRequestDto expeditionBagDto)
        {
            using var transaction = DbContext.Database.BeginTransaction(); ;
            var expeditionBagModel = Mapper.Map<ExpeditionBag>(expeditionBagDto);
            ExpeditionBagDto result;
            var expeditionCitizen = DbContext.ExpeditionCitizens.Single(citizen => citizen.IdExpeditionCitizen == citizenId);
            if (expeditionBagDto.Id.HasValue)
            {
                // Si l'id du sac du citizen a changer, on delete l'ancien sac
                if (expeditionCitizen.IdExpeditionBag != expeditionBagDto.Id)
                {
                    DbContext.Remove(DbContext.ExpeditionBags.Single(expeditionBag => expeditionBag.IdExpeditionBag == expeditionBagDto.Id));
                }
                // UpdateAsync 
                var expeditionBagFromDb = DbContext.GetExpeditionBag(expeditionBagDto.Id.Value);
                expeditionBagFromDb.UpdateAllButKeysProperties(expeditionBagModel);
                DbContext.Update(expeditionBagFromDb);
                expeditionCitizen.IdExpeditionBagNavigation = expeditionBagFromDb;
                DbContext.SaveChanges();
                var updatedExpeditionBag = DbContext.GetExpeditionBag(expeditionBagDto.Id.Value);
                result = Mapper.Map<ExpeditionBagDto>(expeditionBagFromDb);
            }
            else
            {
                // Si y'a déjà un bag, on remove
                if (expeditionCitizen.IdExpeditionBag != null)
                {
                    DbContext.Remove(DbContext.ExpeditionBags.Single(expeditionBag => expeditionBag.IdExpeditionBag == expeditionCitizen.IdExpeditionBag));
                }
                // Create
                var newEntity = DbContext.Add(expeditionBagModel).Entity;
                expeditionCitizen.IdExpeditionBagNavigation = newEntity;
                DbContext.SaveChanges();
                var newEntityWithDependance = DbContext.GetExpeditionBag(newEntity.IdExpeditionBag);
                result = Mapper.Map<ExpeditionBagDto>(newEntityWithDependance);
            }
            transaction.Commit();
            return result;
        }

        public void DeleteExpeditionBag(int bagId)
        {
            var expeditionBag = DbContext.ExpeditionBags.Single(bag => bag.IdExpeditionBag == bagId);
            DbContext.Remove(expeditionBag);
            DbContext.SaveChanges();
        }

        #endregion
    }
}
