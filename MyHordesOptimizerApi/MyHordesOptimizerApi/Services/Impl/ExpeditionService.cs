using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Extensions.Models.Expeditions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Expeditions;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class ExpeditionService : IExpeditionService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }
        protected ILogger<ExpeditionService> Logger { get; private set; }
        protected MhoContext DbContext { get; init; }
        protected TownSyncLock TownSyncLock { get; private set; }

        public ExpeditionService(IServiceScopeFactory serviceScopeFactory,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            ILogger<ExpeditionService> logger,
            MhoContext dbContext,
            TownSyncLock townSyncLock)
        {
            ServiceScopeFactory = serviceScopeFactory;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
            DbContext = dbContext;
            TownSyncLock = townSyncLock;
        }

        #region Expeditions

        public async Task<ExpeditionDto> SaveExpeditionAsync(ExpeditionRequestDto expeditionDto, int idTown, int day)
        {
            // Verrou pris sur le mapId brut AVANT résolution (même convention que WishListService/TownService) :
            // sur une ville déjà synchronisée, verrouiller après résolution prendrait -IdTown, jamais exclusif
            // avec une synchro/login concurrente qui verrouille -MapId.
            await using var townLock = await TownSyncLock.AcquireTownAsync(-idTown);
            idTown = DbContext.ResolveTownId(idTown);
            EnsureDayIsEditable(idTown, day);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            await DbContext.SaveChangesAsync();
            var expeditionModel = Mapper.Map<Expedition>(expeditionDto, opt => opt.SetDbContext(DbContext));
            expeditionModel.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            expeditionModel.Day = day;
            expeditionModel.IdTown = idTown;
            ExpeditionDto result;
            if (expeditionDto.Id.HasValue)
            {
                // UpdateAsync
                var modelFromDb = await DbContext.Expeditions
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
                    .SingleAsync();

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
                await DbContext.PatchAsync(expeditionsOrderFromDb, expeditionsOrderFromDto);
                await DbContext.PatchAsync(partFromDb, partFromDto);
                await DbContext.PatchAsync(citizenFromDb, citizenFromDto);

                modelFromDb.UpdateAllButKeysProperties(expeditionModel);
                DbContext.Update(modelFromDb);
                await DbContext.SaveChangesAsync();
                result = Mapper.Map<ExpeditionDto>(modelFromDb);
            }
            else
            {
                // Create : une partie par défaut est créée ici (et non côté front en réaction au
                // broadcast) pour n'être créée qu'une seule fois, quel que soit le nombre de clients
                // connectés à la ville au moment de la création.
                var newEntity = DbContext.Add(expeditionModel).Entity;
                await DbContext.SaveChangesAsync();
                DbContext.Add(new ExpeditionPart { IdExpedition = newEntity.IdExpedition, Position = 0 });
                await DbContext.SaveChangesAsync();
                var expeditionWithDefaultPart = await DbContext.Expeditions
                    .Where(expedition => expedition.IdExpedition == newEntity.IdExpedition)
                    .IncludeAll()
                    .SingleAsync();
                result = Mapper.Map<ExpeditionDto>(expeditionWithDefaultPart);
            }
            await DbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            return result;
        }

        public List<ExpeditionDto> GetExpeditionsByDay(int townId, int day)
        {
            townId = DbContext.ResolveTownId(townId);
            var models = DbContext.Expeditions.Where(expedition => expedition.IdTown == townId && expedition.Day == day)
                .IncludeAll()
                .ToList();
            var dtos = Mapper.Map<List<ExpeditionDto>>(models);
            return dtos;
        }

        public List<ExpeditionDto> GetUserExpeditionsByDay(int townId, int userId, int day)
        {
            townId = DbContext.ResolveTownId(townId);
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
            if (expedition.IdTown.HasValue)
            {
                EnsureDayIsEditable(expedition.IdTown.Value, expedition.Day);
            }
            DbContext.Remove(expedition);
            DbContext.SaveChanges();
        }

        public async Task<List<ExpeditionDto>> CopyExpeditionsAsync(int townId, int fromDay, int targetDay)
        {
            // Cf. SaveExpeditionAsync : verrou sur le mapId brut AVANT résolution.
            await using var townLock = await TownSyncLock.AcquireTownAsync(-townId);
            townId = DbContext.ResolveTownId(townId);
            EnsureDayIsEditable(townId, targetDay);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            await DbContext.SaveChangesAsync();
            var modelsFromDb = await DbContext.Expeditions
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
                           .ToListAsync();

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
                newExpeditions.Add(updatedNewExpedition);
            }
            await DbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            var returnedDto = Mapper.Map<List<ExpeditionDto>>(newExpeditions);
            return returnedDto;
        }

        public ExpeditionInhorenceModel ValidateExpeditions(int townId, int day)
        {
            townId = DbContext.ResolveTownId(townId);
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
            var nbAliveCitizen = DbContext.TownCitizens.Count(townCitizen => townCitizen.IdTown == townId && townCitizen.Dead != true);
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
            // Vérifié pour la création ET le déplacement (expeditionPartId = partie CIBLE dans les deux cas) :
            // sans ce garde-fou côté cible, un déplacement pourrait affecter un citoyen à une partie dont
            // le jour est déjà verrouillé.
            var townLockKey = EnsurePartDayIsEditable(expeditionPartId);
            await using var townLock = await TownSyncLock.AcquireTownAsync(townLockKey);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            await DbContext.SaveChangesAsync();
            var expeditionCitizenModel = Mapper.Map<ExpeditionCitizen>(expeditionCitizen, opt => opt.SetDbContext(DbContext));
            expeditionCitizenModel.IdExpeditionPart = expeditionPartId;
            ExpeditionCitizenDto result;
            if (expeditionCitizen.Id.HasValue)
            {
                // UpdateAsync
                var expeditionCitizenFromDb = await DbContext.ExpeditionCitizens.Where(citizen => citizen.IdExpeditionCitizen == expeditionCitizen.Id.Value)
                    .IncludeAll()
                    .SingleAsync();

                var existingExpedition = expeditionCitizenFromDb.IdExpeditionPartNavigation?.IdExpeditionNavigation;
                if (existingExpedition is not null && existingExpedition.IdTown.HasValue)
                {
                    await EnsureDayIsEditableAsync(existingExpedition.IdTown.Value, existingExpedition.Day);
                }

                var orderFromDb = expeditionCitizenFromDb.ExpeditionOrders;
                var orderFromDto = expeditionCitizenModel.ExpeditionOrders;
                await DbContext.PatchAsync(orderFromDb, orderFromDto);

                // UpdateAllButKeysProperties nullifie la navigation IdExpeditionPartNavigation (copiée
                // depuis expeditionCitizenModel, qui n'en porte pas), ce qui efface aussi la FK. On la
                // restaure explicitement vers la PARTIE CIBLE (expeditionPartId) pour permettre un
                // déplacement de citoyen entre parties — restaurer l'ancienne partie annulerait le move.
                var targetPart = await DbContext.ExpeditionParts.SingleAsync(part => part.IdExpeditionPart == expeditionPartId);
                expeditionCitizenFromDb.UpdateAllButKeysProperties(expeditionCitizenModel);
                expeditionCitizenFromDb.IdExpeditionPartNavigation = targetPart;
                expeditionCitizenFromDb.IdExpeditionPart = targetPart.IdExpeditionPart;
                await DbContext.SaveChangesAsync();
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
                await DbContext.SaveChangesAsync();
                var expeditionCitizenFromDb = await DbContext.ExpeditionCitizens.Where(citizen => citizen.IdExpeditionCitizen == newEntity.IdExpeditionCitizen)
                  .IncludeAll()
                  .SingleAsync();
                result = Mapper.Map<ExpeditionCitizenDto>(expeditionCitizenFromDb);
            }
            await transaction.CommitAsync();
            return result;
        }

        public void DeleteExpeditionCitizen(int expeditionCitizenId)
        {
            var expeditionCitizen = DbContext.ExpeditionCitizens.Single(expedition => expedition.IdExpeditionCitizen == expeditionCitizenId);
            if (expeditionCitizen.IdExpeditionPart.HasValue)
            {
                EnsurePartDayIsEditable(expeditionCitizen.IdExpeditionPart.Value);
            }
            DbContext.Remove(expeditionCitizen);
            DbContext.SaveChanges();
        }

        #endregion

        #region ExpeditionParts

        public async Task<ExpeditionPartDto> SaveExpeditionPartAsync(int expeditionId, ExpeditionPartRequestDto expeditionPart)
        {
            var townLockKey = EnsureExpeditionDayIsEditable(expeditionId);
            await using var townLock = await TownSyncLock.AcquireTownAsync(townLockKey);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            await DbContext.SaveChangesAsync();
            var expeditionPartModel = Mapper.Map<ExpeditionPart>(expeditionPart, opt => opt.SetDbContext(DbContext));
            expeditionPartModel.IdExpedition = expeditionId;
            ExpeditionPartDto result;
            if (expeditionPart.Id.HasValue)
            {
                // UpdateAsync
                var expeditionPartFromDb = await DbContext.ExpeditionParts.Where(part => part.IdExpeditionPart == expeditionPart.Id.Value)
                    .Include(part => part.IdExpeditionOrders)
                    .Include(part => part.ExpeditionCitizens)
                        .ThenInclude(citizen => citizen.ExpeditionOrders)
                    .Include(part => part.ExpeditionCitizens)
                        .ThenInclude(citizen => citizen.IdExpeditionBagNavigation)
                            .ThenInclude(bag => bag.ExpeditionBagItems)
                                .ThenInclude(bagItem => bagItem.IdItemNavigation)
                    .SingleAsync();

                // On récupère les collections de la db
                var orderFromDb = expeditionPartFromDb.IdExpeditionOrders.ToList();
                orderFromDb.AddRange(expeditionPartFromDb.ExpeditionCitizens.SelectMany(citizen => citizen.ExpeditionOrders));
                var citizenFromDb = expeditionPartFromDb.ExpeditionCitizens;
                // On récupère les mêmes collection du model a update
                var orderFromModel = expeditionPartModel.IdExpeditionOrders.ToList();
                orderFromModel.AddRange(expeditionPartModel.ExpeditionCitizens.SelectMany(citizen => citizen.ExpeditionOrders));
                var citizenFromModel = expeditionPartModel.ExpeditionCitizens;
                // On patch les collections
                await DbContext.PatchAsync(orderFromDb, orderFromModel);
                await DbContext.PatchAsync(citizenFromDb, citizenFromModel);

                expeditionPartFromDb.UpdateAllButKeysProperties(expeditionPartModel);
                await DbContext.SaveChangesAsync();
                result = Mapper.Map<ExpeditionPartDto>(expeditionPartFromDb);
            }
            else
            {
                // Create : un membre par défaut est créé ici (et non côté front en réaction au
                // broadcast) quand c'est la première partie de l'expédition, pour n'être créé qu'une
                // seule fois, quel que soit le nombre de clients connectés à la ville.
                var newEntity = DbContext.Add(expeditionPartModel).Entity;
                await DbContext.SaveChangesAsync();
                var isFirstPart = await DbContext.ExpeditionParts.CountAsync(part => part.IdExpedition == expeditionId) == 1;
                if (isFirstPart)
                {
                    DbContext.Add(new ExpeditionCitizen { IdExpeditionPart = newEntity.IdExpeditionPart, IdExpeditionBagNavigation = new ExpeditionBag() });
                    await DbContext.SaveChangesAsync();
                }
                var expeditionPartWithDefaultCitizen = await DbContext.ExpeditionParts
                    .Where(part => part.IdExpeditionPart == newEntity.IdExpeditionPart)
                    .Include(part => part.IdExpeditionOrders)
                    .Include(part => part.ExpeditionCitizens)
                        .ThenInclude(citizen => citizen.ExpeditionOrders)
                    .Include(part => part.ExpeditionCitizens)
                        .ThenInclude(citizen => citizen.IdExpeditionBagNavigation)
                            .ThenInclude(bag => bag.ExpeditionBagItems)
                                .ThenInclude(bagItem => bagItem.IdItemNavigation)
                    .SingleAsync();
                result = Mapper.Map<ExpeditionPartDto>(expeditionPartWithDefaultCitizen);
            }
            await transaction.CommitAsync();
            return result;
        }

        public void DeleteExpeditionPart(int expeditionPartId)
        {
            var expeditionPart = DbContext.ExpeditionParts.Single(part => part.IdExpeditionPart == expeditionPartId);
            if (expeditionPart.IdExpedition.HasValue)
            {
                EnsureExpeditionDayIsEditable(expeditionPart.IdExpedition.Value);
            }
            DbContext.Remove(expeditionPart);
            DbContext.SaveChanges();
        }

        #endregion

        #region Orders

        public async Task<List<ExpeditionOrderDto>> SaveCitizenOrdersAsync(int expeditionCitizenId, List<ExpeditionOrderDto> expeditionOrder)
        {
            var townLockKey = EnsureCitizenDayIsEditable(expeditionCitizenId);
            await using var townLock = await TownSyncLock.AcquireTownAsync(townLockKey);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            await DbContext.SaveChangesAsync();
            var expeditionCitizen = await DbContext.ExpeditionCitizens
                .Where(citizen => citizen.IdExpeditionCitizen == expeditionCitizenId)
                .Include(citizen => citizen.ExpeditionOrders)
                .Include(citizen => citizen.IdExpeditionPartNavigation)
                .SingleAsync();
            var toAdd = expeditionOrder.Where(orderDto => orderDto.Id is null);
            var toUpdate = expeditionOrder.Where(orderDto => orderDto.Id is not null).ToList();
            var orderModels = new List<ExpeditionOrder>();
            foreach (var orderDto in toAdd)
            {
                var orderModel = Mapper.Map<ExpeditionOrder>(orderDto);
                orderModel.IdExpeditionCitizen = expeditionCitizenId;
                // Create
                var newEntity = DbContext.Add(orderModel);
                orderModels.Add(newEntity.Entity);
            }
            // Chargement groupé (1 requête) au lieu d'un .Single() par commande à mettre à jour.
            var toUpdateIds = toUpdate.Select(orderDto => orderDto.Id!.Value).ToList();
            var ordersFromDb = await DbContext.ExpeditionOrders
                .Where(order => toUpdateIds.Contains(order.IdExpeditionOrder))
                .ToListAsync();
            foreach (var orderDto in toUpdate)
            {
                // UpdateAsync
                var expeditionOrderFromDb = ordersFromDb.Single(order => order.IdExpeditionOrder == orderDto.Id);
                var orderModel = Mapper.Map<ExpeditionOrder>(orderDto);
                orderModel.IdExpeditionCitizen = expeditionCitizenId;
                orderModel.IdExpeditionCitizenNavigation = expeditionCitizen;
                expeditionOrderFromDb.UpdateAllButKeysProperties(orderModel);
                orderModels.Add(expeditionOrderFromDb);
            }
            var orderFromDb = expeditionCitizen.ExpeditionOrders.ToList();
            var toRemove = orderFromDb.Except(orderModels, EqualityComparerFactory.CreateDefault<ExpeditionOrder>());
            DbContext.RemoveRange(toRemove);
            // Un seul aller-retour BDD pour tous les ajouts, mises à jour et suppressions du lot.
            await DbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            var results = Mapper.Map<List<ExpeditionOrderDto>>(orderModels);
            return results;
        }

        public async Task<List<ExpeditionOrderDto>> SavePartOrdersAsync(int expeditionPartId, List<ExpeditionOrderDto> expeditionOrder)
        {
            var townLockKey = EnsurePartDayIsEditable(expeditionPartId);
            await using var townLock = await TownSyncLock.AcquireTownAsync(townLockKey);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            await DbContext.SaveChangesAsync();
            var expeditionPart = await DbContext.ExpeditionParts
                .Where(part => part.IdExpeditionPart == expeditionPartId)
                .Include(part => part.IdExpeditionOrders)
                .SingleAsync();
            var initialOrderFromDb = expeditionPart.IdExpeditionOrders.ToList();
            var toAdd = expeditionOrder.Where(orderDto => orderDto.Id is null);
            var toUpdate = expeditionOrder.Where(orderDto => orderDto.Id is not null).ToList();
            var orderModels = new List<ExpeditionOrder>();
            foreach (var orderDto in toAdd)
            {
                var orderModel = Mapper.Map<ExpeditionOrder>(orderDto);
                // Create
                var newEntity = DbContext.Add(orderModel);
                orderModels.Add(newEntity.Entity);
            }
            // Chargement groupé (1 requête) au lieu d'un .Single() par commande à mettre à jour.
            var toUpdateIds = toUpdate.Select(orderDto => orderDto.Id!.Value).ToList();
            var ordersFromDb = await DbContext.ExpeditionOrders
                .Where(order => toUpdateIds.Contains(order.IdExpeditionOrder))
                .ToListAsync();
            foreach (var orderDto in toUpdate)
            {
                // UpdateAsync
                var expeditionOrderFromDb = ordersFromDb.Single(order => order.IdExpeditionOrder == orderDto.Id);
                var orderModel = Mapper.Map<ExpeditionOrder>(orderDto);
                expeditionOrderFromDb.UpdateAllButKeysProperties(orderModel);
                orderModels.Add(expeditionOrderFromDb);
            }
            var toRemove = initialOrderFromDb.Except(orderModels, EqualityComparerFactory.CreateDefault<ExpeditionOrder>());
            DbContext.RemoveRange(toRemove);
            expeditionPart.IdExpeditionOrders = orderModels;
            // Un seul aller-retour BDD pour tous les ajouts, mises à jour et suppressions du lot.
            await DbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            var results = Mapper.Map<List<ExpeditionOrderDto>>(orderModels);
            return results;
        }

        public void DeleteExpeditionOrder(int expeditionOrderId)
        {
            var expeditionOrder = DbContext.ExpeditionOrders
                .Include(order => order.IdExpeditionCitizenNavigation)
                    .ThenInclude(citizen => citizen.IdExpeditionPartNavigation)
                        .ThenInclude(part => part.IdExpeditionNavigation)
                .Include(order => order.IdExpeditionParts)
                    .ThenInclude(part => part.IdExpeditionNavigation)
                .Single(order => order.IdExpeditionOrder == expeditionOrderId);
            EnsureOrderDayIsEditable(expeditionOrder);
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
            EnsureOrderDayIsEditable(expeditionOrderModel);
            var modelFromDto = Mapper.Map<ExpeditionOrder>(expeditionOrderDto);
            expeditionOrderModel.UpdateAllButKeysProperties(modelFromDto, ignoreNull: true);
            DbContext.Update(expeditionOrderModel);
            DbContext.SaveChanges();
            var returnedDto = Mapper.Map<ExpeditionOrderDto>(expeditionOrderModel);
            return returnedDto;
        }

        #endregion

        #region Bags
        public async Task<ExpeditionBagDto> UpdateExpeditionBag(int citizenId, ExpeditionBagRequestDto expeditionBagDto)
        {
            var townLockKey = EnsureCitizenDayIsEditable(citizenId);
            await using var townLock = await TownSyncLock.AcquireTownAsync(townLockKey);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            var expeditionBagModel = Mapper.Map<ExpeditionBag>(expeditionBagDto);
            ExpeditionBagDto result;
            var expeditionCitizen = await DbContext.ExpeditionCitizens
                .Include(citizen => citizen.IdExpeditionPartNavigation)
                .SingleAsync(citizen => citizen.IdExpeditionCitizen == citizenId);
            if (expeditionBagDto.Id.HasValue)
            {
                // Si l'id du sac du citizen a changer, on delete l'ancien sac
                if (expeditionCitizen.IdExpeditionBag != expeditionBagDto.Id)
                {
                    DbContext.Remove(await DbContext.ExpeditionBags.SingleAsync(expeditionBag => expeditionBag.IdExpeditionBag == expeditionBagDto.Id));
                }
                // UpdateAsync : UpdateAllButKeysProperties recopie aussi les navigations (à leur valeur par
                // défaut côté DTO), il faut restaurer ExpeditionCitizens sous peine de l'écraser et
                // d'orpheliner le citoyen (ExpeditionCitizen_ibfk_4 est ON DELETE CASCADE).
                var expeditionBagFromDb = await DbContext.GetExpeditionBagAsync(expeditionBagDto.Id.Value);
                var citizensInBag = expeditionBagFromDb.ExpeditionCitizens;
                expeditionBagFromDb.UpdateAllButKeysProperties(expeditionBagModel);
                expeditionBagFromDb.ExpeditionCitizens = citizensInBag;
                DbContext.Update(expeditionBagFromDb);
                expeditionCitizen.IdExpeditionBagNavigation = expeditionBagFromDb;
                await DbContext.SaveChangesAsync();
                var updatedExpeditionBag = await DbContext.GetExpeditionBagAsync(expeditionBagDto.Id.Value);
                result = Mapper.Map<ExpeditionBagDto>(updatedExpeditionBag);
            }
            else
            {
                // Create : on repointe d'abord le citoyen sur le nouveau sac avant de supprimer l'ancien,
                // car ExpeditionCitizen_ibfk_4 est ON DELETE CASCADE (supprimer le sac pendant qu'il est
                // encore référencé supprimerait le citoyen).
                var oldBagId = expeditionCitizen.IdExpeditionBag;
                var newEntity = DbContext.Add(expeditionBagModel).Entity;
                expeditionCitizen.IdExpeditionBagNavigation = newEntity;
                await DbContext.SaveChangesAsync();
                if (oldBagId != null)
                {
                    DbContext.Remove(await DbContext.ExpeditionBags.SingleAsync(expeditionBag => expeditionBag.IdExpeditionBag == oldBagId));
                    await DbContext.SaveChangesAsync();
                }
                var newEntityWithDependance = await DbContext.GetExpeditionBagAsync(newEntity.IdExpeditionBag);
                result = Mapper.Map<ExpeditionBagDto>(newEntityWithDependance);
            }
            await transaction.CommitAsync();
            return result;
        }

        public List<ExpeditionBagDto> DeleteExpeditionBag(int bagId)
        {
            var expeditionBag = DbContext.ExpeditionBags
                .Include(bag => bag.ExpeditionCitizens)
                .Single(bag => bag.IdExpeditionBag == bagId);
            foreach (var citizen in expeditionBag.ExpeditionCitizens)
            {
                EnsureCitizenDayIsEditable(citizen.IdExpeditionCitizen);
            }
            var citizenIds = expeditionBag.ExpeditionCitizens.Select(citizen => citizen.IdExpeditionCitizen).ToList();
            // On détache d'abord les citoyens du sac : ExpeditionCitizen_ibfk_4 est ON DELETE CASCADE,
            // les supprimer avec le sac encore référencé supprimerait aussi les citoyens.
            foreach (var citizen in expeditionBag.ExpeditionCitizens)
            {
                citizen.IdExpeditionBag = null;
            }
            DbContext.SaveChanges();
            DbContext.Remove(expeditionBag);
            DbContext.SaveChanges();

            // Chaque citoyen qui avait ce sac reçoit un sac vide de remplacement, créé une seule fois côté
            // serveur (et non par chaque client connecté à la ville qui recevait l'événement de suppression).
            var replacementBags = new List<ExpeditionBagDto>();
            foreach (var citizenId in citizenIds)
            {
                var citizen = DbContext.ExpeditionCitizens.Single(c => c.IdExpeditionCitizen == citizenId);
                var newBag = DbContext.Add(new ExpeditionBag()).Entity;
                citizen.IdExpeditionBagNavigation = newBag;
                DbContext.SaveChanges();
                replacementBags.Add(Mapper.Map<ExpeditionBagDto>(DbContext.GetExpeditionBag(newBag.IdExpeditionBag)));
            }
            return replacementBags;
        }

        #endregion

        /// <summary>Rejette toute écriture sur un jour antérieur au jour actuel de la ville.</summary>
        private void EnsureDayIsEditable(int townId, int? day)
        {
            var townDay = DbContext.Towns.Where(town => town.IdTown == townId).Select(town => town.Day).Single();
            ThrowIfDayLocked(day, townDay);
        }

        /// <summary>
        /// Équivalent async d'<see cref="EnsureDayIsEditable"/>, pour les appels faits sous le verrou par
        /// ville (dans une méthode async déjà entrée dans son <c>await using townLock</c>) : un appel
        /// synchrone y immobiliserait un thread du pool pendant l'I/O au lieu de le libérer.
        /// </summary>
        private async Task EnsureDayIsEditableAsync(int townId, int? day)
        {
            var townDay = await DbContext.Towns.Where(town => town.IdTown == townId).Select(town => town.Day).SingleAsync();
            ThrowIfDayLocked(day, townDay);
        }

        /// <summary>Lève si le jour est verrouillé. Factorisé pour éviter de dupliquer le message d'erreur.</summary>
        private static void ThrowIfDayLocked(int? day, int townDay)
        {
            if (ExpeditionDayLock.IsLocked(day, townDay))
            {
                throw new MhoTechnicalException("Cette expédition appartient à un jour déjà passé et ne peut plus être modifiée.");
            }
        }

        /// <summary>
        /// Rejette toute écriture sur une expédition dont le jour est déjà passé. Requête projetée unique
        /// (expédition + ville en un aller-retour) au lieu de deux SELECT séquentiels. Retourne la clé de
        /// verrou TownSyncLock (cf. <see cref="ComputeTownLockKey"/>), réutilisée par les appelants pour
        /// l'acquisition du verrou par ville.
        /// </summary>
        private int EnsureExpeditionDayIsEditable(int expeditionId)
        {
            var expedition = DbContext.Expeditions
                .Where(expedition => expedition.IdExpedition == expeditionId)
                .Select(expedition => new
                {
                    expedition.IdTown,
                    expedition.Day,
                    // Town.Day est non-nullable : sans le cast, EF plante (Nullable object must have a
                    // value) dès que IdTownNavigation n'a pas de correspondance (IdTown null notamment).
                    TownDay = expedition.IdTownNavigation != null ? (int?)expedition.IdTownNavigation.Day : null,
                    // Même navigation déjà jointe pour TownDay : ajouter MapId à la projection ne coûte
                    // aucun aller-retour BDD supplémentaire.
                    MapId = expedition.IdTownNavigation != null ? expedition.IdTownNavigation.MapId : null
                })
                .Single();
            if (expedition.TownDay.HasValue)
            {
                ThrowIfDayLocked(expedition.Day, expedition.TownDay.Value);
            }
            return ComputeTownLockKey(expedition.IdTown, expedition.MapId);
        }

        /// <summary>
        /// Rejette toute écriture sur une partie d'expédition dont le jour est déjà passé. Requête projetée
        /// unique (partie + expédition + ville) au lieu de trois SELECT séquentiels. Retourne la clé de
        /// verrou TownSyncLock (cf. <see cref="ComputeTownLockKey"/>), réutilisée par les appelants pour
        /// l'acquisition du verrou par ville.
        /// </summary>
        private int EnsurePartDayIsEditable(int expeditionPartId)
        {
            var part = DbContext.ExpeditionParts
                .Where(part => part.IdExpeditionPart == expeditionPartId)
                .Select(part => new
                {
                    IdTown = part.IdExpeditionNavigation.IdTown,
                    Day = part.IdExpeditionNavigation.Day,
                    // Town.Day est non-nullable : sans le cast, EF plante dès que la chaîne FK ne mène
                    // à aucune ville (expédition sans IdTown, notamment).
                    TownDay = part.IdExpeditionNavigation.IdTownNavigation != null ? (int?)part.IdExpeditionNavigation.IdTownNavigation.Day : null,
                    MapId = part.IdExpeditionNavigation.IdTownNavigation != null ? part.IdExpeditionNavigation.IdTownNavigation.MapId : null
                })
                .Single();
            if (part.TownDay.HasValue)
            {
                ThrowIfDayLocked(part.Day, part.TownDay.Value);
            }
            return ComputeTownLockKey(part.IdTown, part.MapId);
        }

        /// <summary>
        /// Rejette toute écriture sur un citoyen d'expédition dont le jour est déjà passé. Requête projetée
        /// unique (citoyen + partie + expédition + ville) au lieu de quatre SELECT séquentiels. Retourne la
        /// clé de verrou TownSyncLock (cf. <see cref="ComputeTownLockKey"/>), réutilisée par les appelants
        /// pour l'acquisition du verrou par ville.
        /// </summary>
        private int EnsureCitizenDayIsEditable(int expeditionCitizenId)
        {
            var citizen = DbContext.ExpeditionCitizens
                .Where(citizen => citizen.IdExpeditionCitizen == expeditionCitizenId)
                .Select(citizen => new
                {
                    IdTown = citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.IdTown,
                    Day = citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.Day,
                    // Town.Day est non-nullable : sans le cast, EF plante dès que la chaîne FK ne mène
                    // à aucune ville (expédition sans IdTown, notamment).
                    TownDay = citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.IdTownNavigation != null
                        ? (int?)citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.IdTownNavigation.Day
                        : null,
                    MapId = citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.IdTownNavigation != null
                        ? citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.IdTownNavigation.MapId
                        : null
                })
                .Single();
            if (citizen.TownDay.HasValue)
            {
                ThrowIfDayLocked(citizen.Day, citizen.TownDay.Value);
            }
            return ComputeTownLockKey(citizen.IdTown, citizen.MapId);
        }

        /// <summary>
        /// Calcule la clé de verrou TownSyncLock (convention mapId brut négatif, même famille que
        /// MyHordesFetcherService/ExternalToolsService/WishListService/TownService) à partir d'un townId
        /// DÉJÀ résolu façon <see cref="MhoContext.ResolveTownId"/> (positif si synchronisé, -mapId si
        /// provisoire) et du MapId joint dans la même requête pour une ville synchronisée.
        /// </summary>
        private static int ComputeTownLockKey(int? resolvedIdTown, int? mapId)
        {
            if (!resolvedIdTown.HasValue)
            {
                // Chaîne FK cassée (expédition/partie/citoyen sans ville) : clé partagée 0, comportement
                // inchangé par rapport à l'ancien -(idTown ?? 0).
                return 0;
            }
            if (resolvedIdTown.Value < 0)
            {
                // Ville provisoire : resolvedIdTown vaut déjà -mapId (cf. ResolveTownId), ne pas le
                // négater une seconde fois sous peine de retomber sur +mapId.
                return resolvedIdTown.Value;
            }
            // Ville synchronisée : verrouiller sur le mapId brut, jamais sur l'IdTown interne résolu,
            // pour s'exclure mutuellement avec une synchro/login concurrente sur la même ville.
            // Repli dégradé sur -resolvedIdTown si MapId est inconnu (ne devrait pas arriver en pratique
            // pour une ville synchronisée) : ne s'exclut pas avec la famille synchro/login, mais reste
            // préférable à planter.
            return mapId.HasValue ? -mapId.Value : -resolvedIdTown.Value;
        }

        /// <summary>
        /// Rejette toute écriture sur une commande dont le jour est déjà passé. Une commande appartient
        /// soit à un citoyen, soit directement à une ou plusieurs parties (cf. ExpeditionMappingProfiles).
        /// </summary>
        private void EnsureOrderDayIsEditable(ExpeditionOrder order)
        {
            if (order.IdExpeditionCitizenNavigation is not null)
            {
                var expedition = order.IdExpeditionCitizenNavigation.IdExpeditionPartNavigation?.IdExpeditionNavigation;
                if (expedition is not null && expedition.IdTown.HasValue)
                {
                    EnsureDayIsEditable(expedition.IdTown.Value, expedition.Day);
                }
            }
            else
            {
                foreach (var part in order.IdExpeditionParts)
                {
                    var expedition = part.IdExpeditionNavigation;
                    if (expedition is not null && expedition.IdTown.HasValue)
                    {
                        EnsureDayIsEditable(expedition.IdTown.Value, expedition.Day);
                    }
                }
            }
        }
    }
}
