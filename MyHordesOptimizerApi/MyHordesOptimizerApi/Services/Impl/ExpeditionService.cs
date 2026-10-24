using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Extensions.Models.Expeditions;
using MyHordesOptimizerApi.Extensions.Models.MapRoutes;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Expeditions;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Impl.MapRoutes;
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
        protected ITownAccessService TownAccessService { get; private set; }

        public ExpeditionService(IServiceScopeFactory serviceScopeFactory,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            ILogger<ExpeditionService> logger,
            MhoContext dbContext,
            TownSyncLock townSyncLock,
            ITownAccessService townAccessService)
        {
            ServiceScopeFactory = serviceScopeFactory;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            Logger = logger;
            DbContext = dbContext;
            TownSyncLock = townSyncLock;
            TownAccessService = townAccessService;
        }

        /// <summary>Ville d'une entité visée par une écriture, une fois l'accès vérifié.</summary>
        /// <param name="IdTown">IdTown résolu (positif, ou -mapId pour une ville provisoire).</param>
        /// <param name="LockKey">Clé TownSyncLock, cf. <see cref="ComputeTownLockKey"/>.</param>
        private readonly record struct WritableTown(int IdTown, int LockKey);

        /// <summary>Tracés dont les parties liées ont changé pendant l'écriture en cours (cf. <see cref="TakeMapRouteChanges"/>).</summary>
        private readonly List<MapRouteChangeDto> _mapRouteChanges = new();

        public IReadOnlyList<MapRouteChangeDto> TakeMapRouteChanges()
        {
            var changes = _mapRouteChanges.ToList();
            _mapRouteChanges.Clear();
            return changes;
        }

        #region Expeditions

        public async Task<ExpeditionDto> SaveExpeditionAsync(ExpeditionRequestDto expeditionDto, int idTown, int day)
        {
            // Verrou pris sur le mapId brut AVANT résolution (même convention que WishListService/TownService) :
            // sur une ville déjà synchronisée, verrouiller après résolution prendrait -IdTown, jamais exclusif
            // avec une synchro/login concurrente qui verrouille -MapId.
            await using var townLock = await TownSyncLock.AcquireTownAsync(-idTown);
            idTown = DbContext.ResolveTownId(idTown);
            await EnsureTownWritableAsync(idTown, day);
            await EnsurePartsBelongToTownAsync(expeditionDto.PartsId, idTown);
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
                // UpdateAsync : l'expédition doit appartenir à la ville vérifiée, sinon un citoyen de la
                // ville A pourrait modifier (et rattacher à A) une expédition de la ville B.
                var modelFromDb = await DbContext.Expeditions
                    .Where(expedition => expedition.IdExpedition == expeditionDto.Id && expedition.IdTown == idTown)
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
                    .Include(expedition => expedition.ExpeditionParts)
                        .ThenInclude(part => part.IdMapRouteNavigation)
                    .AsSplitQuery()
                    .SingleOrDefaultAsync();
                if (modelFromDb is null)
                {
                    throw new MhoForbiddenException($"L'expédition {expeditionDto.Id} n'appartient pas à la ville {idTown}.");
                }

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

        public async Task<List<ExpeditionDto>> GetExpeditionsByDayAsync(int townId, int day)
        {
            var mapId = townId;
            townId = DbContext.ResolveTownId(townId);
            var models = await DbContext.Expeditions.Where(expedition => expedition.IdTown == townId && expedition.Day == day)
                .IncludeAll()
                .ToListAsync();
            var dtos = Mapper.Map<List<ExpeditionDto>>(models);
            // Les tracés sont réservés aux citoyens de la ville (cf. MapRouteService) : un observateur lit les
            // expéditions sans eux.
            var parts = dtos.SelectMany(expedition => expedition.Parts ?? new List<ExpeditionPartDto>()).ToList();
            if (parts.Any(part => part.MapRouteId.HasValue) && !await TownAccessService.CanWriteTownAsync(townId, mapId))
            {
                foreach (var part in parts)
                {
                    part.MapRouteId = null;
                    part.MapRoute = null;
                    part.Path = null;
                }
            }
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
            FillTargetExpeditionLabels(dtos);
            return dtos;
        }

        /// <summary>
        /// Nom des expéditions attendues par les consignes « wait », pour l'addon qui ne lit que les expéditions de
        /// l'utilisateur : une requête projetée sur les seules expéditions visées.
        /// </summary>
        private void FillTargetExpeditionLabels(List<ExpeditionDto> expeditions)
        {
            var orders = expeditions
                .SelectMany(expedition => expedition.Parts ?? new List<ExpeditionPartDto>())
                .SelectMany(part => (part.Orders ?? new List<ExpeditionOrderDto>())
                    .Concat((part.Citizens ?? new List<ExpeditionCitizenDto>()).SelectMany(citizen => citizen.Orders ?? new List<ExpeditionOrderDto>())))
                .Where(order => order.TargetExpeditionId.HasValue)
                .ToList();
            if (orders.Count == 0)
            {
                return;
            }
            var targetIds = orders.Select(order => order.TargetExpeditionId!.Value).Distinct().ToList();
            var labels = DbContext.Expeditions
                .Where(expedition => targetIds.Contains(expedition.IdExpedition))
                .Select(expedition => new { expedition.IdExpedition, expedition.Label })
                .ToDictionary(expedition => expedition.IdExpedition, expedition => expedition.Label);
            foreach (var order in orders)
            {
                var label = labels.GetValueOrDefault(order.TargetExpeditionId!.Value);
                order.TargetExpeditionLabel = string.IsNullOrWhiteSpace(label) ? null : label.Trim();
            }
        }

        /// <summary>
        /// Les consignes copiées attendent encore les expéditions du jour source : elles visent désormais leurs copies
        /// (copies dans l'ordre des sources, identifiants attribués par le SaveChanges précédent).
        /// </summary>
        private async Task RetargetCopiedWaitOrdersAsync(List<Expedition> sources, List<Expedition> copies)
        {
            var copyIds = sources.Zip(copies).ToDictionary(pair => pair.First.IdExpedition, pair => pair.Second.IdExpedition);
            var waitOrders = copies
                .SelectMany(expedition => expedition.ExpeditionParts)
                .SelectMany(part => part.IdExpeditionOrders.Concat(part.ExpeditionCitizens.SelectMany(citizen => citizen.ExpeditionOrders)))
                .Where(order => order.IdTargetExpedition.HasValue)
                .ToList();
            if (waitOrders.Count == 0)
            {
                return;
            }
            foreach (var order in waitOrders)
            {
                order.IdTargetExpedition = copyIds.TryGetValue(order.IdTargetExpedition!.Value, out var copyId) ? copyId : null;
            }
            await DbContext.SaveChangesAsync();
        }

        public void DeleteExpedition(int expeditionId)
        {
            EnsureExpeditionWritable(expeditionId);
            var expedition = DbContext.Expeditions.Single(expedition => expedition.IdExpedition == expeditionId);
            var linkedRouteIds = DbContext.ExpeditionParts
                .Where(part => part.IdExpedition == expeditionId && part.IdMapRoute != null)
                .Select(part => part.IdMapRoute!.Value)
                .Distinct()
                .ToList();
            DbContext.Remove(expedition);
            DbContext.SaveChanges();
            BumpRouteVersions(linkedRouteIds);
        }

        public async Task<List<ExpeditionDto>> CopyExpeditionsAsync(int townId, int fromDay, int targetDay)
        {
            // Cf. SaveExpeditionAsync : verrou sur le mapId brut AVANT résolution.
            await using var townLock = await TownSyncLock.AcquireTownAsync(-townId);
            townId = DbContext.ResolveTownId(townId);
            await EnsureTownWritableAsync(townId, targetDay);
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
                           .Include(expedition => expedition.ExpeditionParts)
                               .ThenInclude(part => part.IdMapRouteNavigation)
                                   .ThenInclude(route => route!.MapRouteShares)
                           .AsSplitQuery()
                           .ToListAsync();

            // Les tracés liés aux expéditions remplacées perdent leurs parties : nouvelle version, diffusée.
            var unlinkedRouteIds = await DbContext.ExpeditionParts
                .Where(part => part.IdExpeditionNavigation!.IdTown == townId && part.IdExpeditionNavigation.Day == targetDay && part.IdMapRoute != null)
                .Select(part => part.IdMapRoute!.Value)
                .Distinct()
                .ToListAsync();
            var existingExpeditionToDelete = DbContext.Expeditions.Where(expedition => expedition.IdTown == townId && expedition.Day == targetDay);
            DbContext.RemoveRange(existingExpeditionToDelete);
            var newExpeditions = new List<Expedition>();
            // Un exemplaire par tracé source, même s'il est lié à plusieurs parties du jour copié.
            var routeCopies = new Dictionary<int, MapRoute>();
            foreach (var modelFromDb in modelsFromDb)
            {
                var newExpedtion = modelFromDb.Copy();
                newExpedtion.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
                newExpedtion.Day = targetDay;
                newExpedtion.State = ExpeditionConstants.ExpeditionStateStop;
                // Expedition.Copy recopie les parties dans l'ordre de la collection source.
                var sourceParts = modelFromDb.ExpeditionParts.ToList();
                var newParts = newExpedtion.ExpeditionParts.ToList();
                for (var index = 0; index < sourceParts.Count; index++)
                {
                    var sourceRoute = sourceParts[index].IdMapRouteNavigation;
                    if (sourceRoute is null)
                    {
                        continue;
                    }
                    if (!routeCopies.TryGetValue(sourceRoute.IdMapRoute, out var routeCopy))
                    {
                        routeCopy = sourceRoute.Copy();
                        DbContext.MapRoutes.Add(routeCopy);
                        routeCopies[sourceRoute.IdMapRoute] = routeCopy;
                    }
                    newParts[index].IdMapRouteNavigation = routeCopy;
                }
                var updatedNewExpedition = DbContext.Add(newExpedtion).Entity;
                newExpeditions.Add(updatedNewExpedition);
            }
            await DbContext.SaveChangesAsync();
            await RetargetCopiedWaitOrdersAsync(modelsFromDb, newExpeditions);
            await BumpRouteVersionsAsync(unlinkedRouteIds);
            await transaction.CommitAsync();
            _mapRouteChanges.AddRange(routeCopies.Values.Select(routeCopy => new MapRouteChangeDto { Id = routeCopy.IdMapRoute, Version = routeCopy.Version }));
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
            var targetTown = EnsurePartWritable(expeditionPartId);
            await using var townLock = await TownSyncLock.AcquireTownAsync(targetTown.LockKey);
            await EnsureOrdersBelongToTownAsync(expeditionCitizen.OrdersId, targetTown.IdTown);
            await EnsureBagBelongsToTownAsync(expeditionCitizen.BagId, targetTown.IdTown);
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

                // Déplacement possible entre parties d'une même ville, jamais depuis une autre ville.
                var existingExpedition = expeditionCitizenFromDb.IdExpeditionPartNavigation?.IdExpeditionNavigation;
                if (existingExpedition is null || existingExpedition.IdTown != targetTown.IdTown)
                {
                    throw new MhoForbiddenException($"Le citoyen d'expédition {expeditionCitizen.Id} n'appartient pas à la ville {targetTown.IdTown}.");
                }
                await EnsureDayIsEditableAsync(targetTown.IdTown, existingExpedition.Day);

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
            EnsureCitizenWritable(expeditionCitizenId);
            var expeditionCitizen = DbContext.ExpeditionCitizens.Single(expedition => expedition.IdExpeditionCitizen == expeditionCitizenId);
            DbContext.Remove(expeditionCitizen);
            DbContext.SaveChanges();
        }

        #endregion

        #region ExpeditionParts

        public async Task<ExpeditionPartDto> SaveExpeditionPartAsync(int expeditionId, ExpeditionPartRequestDto expeditionPart)
        {
            var targetTown = EnsureExpeditionWritable(expeditionId);
            await using var townLock = await TownSyncLock.AcquireTownAsync(targetTown.LockKey);
            await EnsureOrdersBelongToTownAsync(expeditionPart.OrdersId, targetTown.IdTown);
            await EnsureCitizensBelongToTownAsync(expeditionPart.CitizensId, targetTown.IdTown);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            await DbContext.SaveChangesAsync();
            var expeditionPartModel = Mapper.Map<ExpeditionPart>(expeditionPart, opt => opt.SetDbContext(DbContext));
            expeditionPartModel.IdExpedition = expeditionId;
            ExpeditionPartDto result;
            if (expeditionPart.Id.HasValue)
            {
                // UpdateAsync : la partie doit appartenir à la ville vérifiée (UpdateAllButKeysProperties
                // la rattache ensuite à expeditionId).
                var expeditionPartFromDb = await DbContext.ExpeditionParts
                    .Where(part => part.IdExpeditionPart == expeditionPart.Id.Value && part.IdExpeditionNavigation.IdTown == targetTown.IdTown)
                    .Include(part => part.IdExpeditionOrders)
                    .Include(part => part.ExpeditionCitizens)
                        .ThenInclude(citizen => citizen.ExpeditionOrders)
                    .Include(part => part.ExpeditionCitizens)
                        .ThenInclude(citizen => citizen.IdExpeditionBagNavigation)
                            .ThenInclude(bag => bag.ExpeditionBagItems)
                                .ThenInclude(bagItem => bagItem.IdItemNavigation)
                    .SingleOrDefaultAsync();
                if (expeditionPartFromDb is null)
                {
                    throw new MhoForbiddenException($"La partie d'expédition {expeditionPart.Id} n'appartient pas à la ville {targetTown.IdTown}.");
                }
                var linkedRoute = await ApplyRouteLinkAsync(expeditionPartModel, expeditionPartFromDb.IdMapRoute, expeditionId, targetTown);

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
                // UpdateAllButKeysProperties recopie aussi la navigation (null dans le modèle mappé) : clé et
                // navigation remises d'accord, sans quoi EF pourrait délier la partie.
                expeditionPartFromDb.IdMapRouteNavigation = linkedRoute;
                expeditionPartFromDb.IdMapRoute = linkedRoute?.IdMapRoute;
                await DbContext.SaveChangesAsync();
                result = Mapper.Map<ExpeditionPartDto>(expeditionPartFromDb);
            }
            else
            {
                // Create : un membre par défaut est créé ici (et non côté front en réaction au
                // broadcast) quand c'est la première partie de l'expédition, pour n'être créé qu'une
                // seule fois, quel que soit le nombre de clients connectés à la ville.
                expeditionPartModel.IdMapRouteNavigation = await ApplyRouteLinkAsync(expeditionPartModel, previousRouteId: null, expeditionId, targetTown);
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
                    .Include(part => part.IdMapRouteNavigation)
                    .SingleAsync();
                result = Mapper.Map<ExpeditionPartDto>(expeditionPartWithDefaultCitizen);
            }
            await transaction.CommitAsync();
            return result;
        }

        public async Task<List<ExpeditionPartDto>> GetExpeditionPartsAsync(IReadOnlyCollection<int> expeditionPartIds)
        {
            var parts = await DbContext.ExpeditionParts.AsNoTracking()
                .Where(part => expeditionPartIds.Contains(part.IdExpeditionPart))
                .Include(part => part.IdExpeditionOrders)
                .Include(part => part.ExpeditionCitizens)
                    .ThenInclude(citizen => citizen.ExpeditionOrders)
                .Include(part => part.ExpeditionCitizens)
                    .ThenInclude(citizen => citizen.IdExpeditionBagNavigation)
                        .ThenInclude(bag => bag.ExpeditionBagItems)
                            .ThenInclude(bagItem => bagItem.IdItemNavigation)
                .Include(part => part.IdMapRouteNavigation)
                .AsSplitQuery()
                .ToListAsync();
            return parts.Select(part => Mapper.Map<ExpeditionPartDto>(part)).ToList();
        }

        public void DeleteExpeditionPart(int expeditionPartId)
        {
            EnsurePartWritable(expeditionPartId);
            var expeditionPart = DbContext.ExpeditionParts.Single(part => part.IdExpeditionPart == expeditionPartId);
            var linkedRouteId = expeditionPart.IdMapRoute;
            DbContext.Remove(expeditionPart);
            DbContext.SaveChanges();
            if (linkedRouteId.HasValue)
            {
                BumpRouteVersions(new[] { linkedRouteId.Value });
            }
        }

        /// <summary>
        /// Contrôle le tracé demandé pour une partie (<see cref="ExpeditionPart.IdMapRoute"/> du modèle mappé) et
        /// applique les effets d'un changement de lien : le tracé doit être de la ville, visible de l'utilisateur
        /// et lié à aucune partie d'un autre jour (une copie par jour) ; lié, il devient visible de toute la ville
        /// (seul qui peut le modifier peut lever son caractère privé) et donne sa direction à la partie. L'ancien
        /// et le nouveau tracé changent de version, diffusée par le hub (<see cref="TakeMapRouteChanges"/>).
        /// </summary>
        /// <returns>Le tracé lié, suivi par le contexte ; null si la partie n'en a pas.</returns>
        private async Task<MapRoute?> ApplyRouteLinkAsync(ExpeditionPart partModel, int? previousRouteId, int expeditionId, WritableTown town)
        {
            var routeId = partModel.IdMapRoute;
            if (routeId == previousRouteId)
            {
                if (!routeId.HasValue)
                {
                    return null;
                }
                var unchangedRoute = await DbContext.MapRoutes.SingleAsync(route => route.IdMapRoute == routeId.Value);
                ApplyRouteDirection(partModel, unchangedRoute);
                return unchangedRoute;
            }
            MapRoute? linkedRoute = null;
            if (routeId.HasValue)
            {
                var userId = UserInfoProvider.UserId;
                linkedRoute = await DbContext.MapRoutes
                    .Include(route => route.MapRouteShares)
                    .Include(route => route.ExpeditionParts)
                        .ThenInclude(part => part.IdExpeditionNavigation)
                    .AsSplitQuery()
                    .SingleOrDefaultAsync(route => route.IdMapRoute == routeId.Value && route.IdTown == town.IdTown);
                if (linkedRoute is null || !MapRouteRights.IsVisible(linkedRoute, userId))
                {
                    throw new MhoForbiddenException($"Le tracé {routeId} n'est pas un tracé de la ville {town.IdTown} visible par l'utilisateur {userId}.");
                }
                var expedition = await DbContext.Expeditions
                    .Where(expedition => expedition.IdExpedition == expeditionId)
                    .Select(expedition => new { expedition.Day })
                    .SingleAsync();
                if (linkedRoute.ExpeditionParts.Any(part => part.IdExpeditionNavigation?.Day != expedition.Day))
                {
                    throw new MhoTechnicalException("Ce tracé est déjà lié à une expédition d'un autre jour : importez ce jour pour en avoir une copie.");
                }
                if (linkedRoute.IsPrivate)
                {
                    if (!MapRouteRights.IsAuthorOrEditableByAll(linkedRoute, userId))
                    {
                        throw new MhoForbiddenException($"Lier le tracé privé {routeId} le rend visible de toute la ville : réservé à qui peut le modifier.");
                    }
                    linkedRoute.IsPrivate = false;
                    foreach (var share in linkedRoute.MapRouteShares.ToList())
                    {
                        linkedRoute.MapRouteShares.Remove(share);
                        DbContext.MapRouteShares.Remove(share);
                    }
                }
                ApplyRouteDirection(partModel, linkedRoute);
                linkedRoute.Version++;
                _mapRouteChanges.Add(new MapRouteChangeDto { Id = linkedRoute.IdMapRoute, Version = linkedRoute.Version });
            }
            if (previousRouteId.HasValue)
            {
                await BumpRouteVersionsAsync(new[] { previousRouteId.Value });
            }
            return linkedRoute;
        }

        /// <summary>Direction d'une partie liée : celle du premier déplacement de son tracé, quelle que soit celle demandée.</summary>
        private static void ApplyRouteDirection(ExpeditionPart partModel, MapRoute route)
        {
            var direction = MapRouteDirection.FirstCell(MapRouteJson.ParsePoints(route.Cells));
            if (direction.HasValue)
            {
                partModel.Direction = (int)direction.Value;
            }
        }

        /// <summary>
        /// Nouvelle version des tracés dont les parties liées ont changé (incrément atomique en base) : le hub la
        /// diffuse (MapRouteChanged) et les cartes ouvertes relisent le tracé. Un tracé en cours de saisie ailleurs
        /// passe en conflit de version, comme pour toute autre modification.
        /// </summary>
        private async Task BumpRouteVersionsAsync(IReadOnlyCollection<int> routeIds)
        {
            if (routeIds.Count == 0)
            {
                return;
            }
            await DbContext.MapRoutes
                .Where(route => routeIds.Contains(route.IdMapRoute))
                .ExecuteUpdateAsync(setters => setters.SetProperty(route => route.Version, route => route.Version + 1));
            _mapRouteChanges.AddRange(await DbContext.MapRoutes.AsNoTracking()
                .Where(route => routeIds.Contains(route.IdMapRoute))
                .Select(route => new MapRouteChangeDto { Id = route.IdMapRoute, Version = route.Version })
                .ToListAsync());
        }

        /// <inheritdoc cref="BumpRouteVersionsAsync"/>
        private void BumpRouteVersions(IReadOnlyCollection<int> routeIds)
        {
            if (routeIds.Count == 0)
            {
                return;
            }
            DbContext.MapRoutes
                .Where(route => routeIds.Contains(route.IdMapRoute))
                .ExecuteUpdate(setters => setters.SetProperty(route => route.Version, route => route.Version + 1));
            _mapRouteChanges.AddRange(DbContext.MapRoutes.AsNoTracking()
                .Where(route => routeIds.Contains(route.IdMapRoute))
                .Select(route => new MapRouteChangeDto { Id = route.IdMapRoute, Version = route.Version })
                .ToList());
        }

        #endregion

        #region Orders

        public async Task<List<ExpeditionOrderDto>> SaveCitizenOrdersAsync(int expeditionCitizenId, List<ExpeditionOrderDto> expeditionOrder)
        {
            var targetTown = EnsureCitizenWritable(expeditionCitizenId);
            await using var townLock = await TownSyncLock.AcquireTownAsync(targetTown.LockKey);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            await DbContext.SaveChangesAsync();
            var expeditionCitizen = await DbContext.ExpeditionCitizens
                .Where(citizen => citizen.IdExpeditionCitizen == expeditionCitizenId)
                .Include(citizen => citizen.ExpeditionOrders)
                .Include(citizen => citizen.IdExpeditionPartNavigation)
                .SingleAsync();
            // Indexé avant les ajouts (la correction de relations d'EF y insérerait les nouvelles consignes).
            // Seules les consignes de CE citoyen sont modifiables : un identifiant étranger (autre citoyen,
            // autre ville) serait sinon modifié puis rattaché à ce citoyen.
            var ordersFromDb = expeditionCitizen.ExpeditionOrders.ToDictionary(order => order.IdExpeditionOrder);
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
            foreach (var orderDto in toUpdate)
            {
                // UpdateAsync
                if (!ordersFromDb.TryGetValue(orderDto.Id!.Value, out var expeditionOrderFromDb))
                {
                    throw new MhoForbiddenException($"La consigne {orderDto.Id} n'appartient pas au citoyen d'expédition {expeditionCitizenId}.");
                }
                var orderModel = Mapper.Map<ExpeditionOrder>(orderDto);
                orderModel.IdExpeditionCitizen = expeditionCitizenId;
                orderModel.IdExpeditionCitizenNavigation = expeditionCitizen;
                expeditionOrderFromDb.UpdateAllButKeysProperties(orderModel);
                orderModels.Add(expeditionOrderFromDb);
            }
            await ValidateOrdersAsync(orderModels, targetTown.IdTown, expeditionCitizen.IdExpeditionPartNavigation!.IdExpedition!.Value);
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
            var targetTown = EnsurePartWritable(expeditionPartId);
            await using var townLock = await TownSyncLock.AcquireTownAsync(targetTown.LockKey);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            await DbContext.SaveChangesAsync();
            var expeditionPart = await DbContext.ExpeditionParts
                .Where(part => part.IdExpeditionPart == expeditionPartId)
                .Include(part => part.IdExpeditionOrders)
                .SingleAsync();
            var initialOrderFromDb = expeditionPart.IdExpeditionOrders.ToList();
            // Seules les consignes de CETTE partie sont modifiables : un identifiant étranger (autre partie,
            // autre ville) serait sinon modifié puis rattaché à cette partie.
            var ordersFromDb = initialOrderFromDb.ToDictionary(order => order.IdExpeditionOrder);
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
            foreach (var orderDto in toUpdate)
            {
                // UpdateAsync
                if (!ordersFromDb.TryGetValue(orderDto.Id!.Value, out var expeditionOrderFromDb))
                {
                    throw new MhoForbiddenException($"La consigne {orderDto.Id} n'appartient pas à la partie d'expédition {expeditionPartId}.");
                }
                var orderModel = Mapper.Map<ExpeditionOrder>(orderDto);
                expeditionOrderFromDb.UpdateAllButKeysProperties(orderModel);
                orderModels.Add(expeditionOrderFromDb);
            }
            await ValidateOrdersAsync(orderModels, targetTown.IdTown, expeditionPart.IdExpedition!.Value);
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
            EnsureOrderWritable(expeditionOrder);
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
            EnsureOrderWritable(expeditionOrderModel);
            var modelFromDto = Mapper.Map<ExpeditionOrder>(expeditionOrderDto);
            // Case et type ne changent que par SavePartOrdersAsync / SaveCitizenOrdersAsync, qui les valident :
            // ici (cocher, texte), ils restent ceux de la base (ignoreNull).
            modelFromDto.X = null;
            modelFromDto.Y = null;
            modelFromDto.Kind = null;
            modelFromDto.IdItem = null;
            modelFromDto.Quantity = null;
            modelFromDto.HeroSkill = null;
            modelFromDto.IdTargetUser = null;
            modelFromDto.IdTargetExpedition = null;
            modelFromDto.Note = null;
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
            var targetTown = EnsureCitizenWritable(citizenId);
            await using var townLock = await TownSyncLock.AcquireTownAsync(targetTown.LockKey);
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
                    // Sac d'un autre citoyen : il doit être de la même ville, sinon il serait modifié puis
                    // partagé avec ce citoyen.
                    await EnsureBagBelongsToTownAsync(expeditionBagDto.Id, targetTown.IdTown);
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
            if (expeditionBag.ExpeditionCitizens.Count == 0)
            {
                // Sac orphelin : aucune ville à laquelle vérifier l'appartenance.
                throw new MhoForbiddenException($"Le sac d'expédition {bagId} n'est rattaché à aucun citoyen.");
            }
            foreach (var citizen in expeditionBag.ExpeditionCitizens)
            {
                EnsureCitizenWritable(citizen.IdExpeditionCitizen);
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

        /// <summary>
        /// Vérifie la forme des consignes (<see cref="ExpeditionOrderRules"/>, case dans la carte de la ville) puis,
        /// en une requête chacun, que les objets existent, que les citoyens à attendre sont de la ville et que les
        /// expéditions à attendre sont d'autres expéditions du même jour (<paramref name="idExpedition"/> : celle des consignes).
        /// </summary>
        private async Task ValidateOrdersAsync(IReadOnlyCollection<ExpeditionOrder> orders, int idTown, int idExpedition)
        {
            if (orders.Count == 0)
            {
                return;
            }
            var map = await DbContext.Towns
                .Where(town => town.IdTown == idTown)
                .Select(town => new { town.Width, town.Height })
                .SingleAsync();
            foreach (var order in orders)
            {
                ExpeditionOrderRules.Validate(order, map.Width, map.Height);
            }
            var itemIds = orders.Where(order => order.IdItem.HasValue).Select(order => order.IdItem!.Value).Distinct().ToList();
            if (itemIds.Count > 0 && await DbContext.Items.CountAsync(item => itemIds.Contains(item.IdItem)) != itemIds.Count)
            {
                throw new MhoTechnicalException("Objet de consigne inconnu.");
            }
            var targetUserIds = orders.Where(order => order.IdTargetUser.HasValue).Select(order => order.IdTargetUser!.Value).Distinct().ToList();
            if (targetUserIds.Count > 0 && await DbContext.CountTownMembersAsync(idTown, targetUserIds) != targetUserIds.Count)
            {
                throw new MhoTechnicalException("Le citoyen à attendre n'est pas de la ville.");
            }
            var targetExpeditionIds = orders.Where(order => order.IdTargetExpedition.HasValue).Select(order => order.IdTargetExpedition!.Value).Distinct().ToList();
            if (targetExpeditionIds.Count > 0)
            {
                if (targetExpeditionIds.Contains(idExpedition))
                {
                    throw new MhoTechnicalException("Une expédition ne peut pas s'attendre elle-même.");
                }
                var day = await DbContext.Expeditions.Where(expedition => expedition.IdExpedition == idExpedition).Select(expedition => expedition.Day).SingleAsync();
                var sameDay = await DbContext.Expeditions.CountAsync(expedition => targetExpeditionIds.Contains(expedition.IdExpedition) && expedition.IdTown == idTown && expedition.Day == day);
                if (sameDay != targetExpeditionIds.Count)
                {
                    throw new MhoTechnicalException("L'expédition à attendre n'est pas une expédition du même jour de la ville.");
                }
            }
        }

        /// <summary>
        /// Rejette l'écriture si l'utilisateur courant n'a pas accès à la ville (cf. <see cref="ITownAccessService"/>)
        /// ou si le jour est antérieur au jour actuel de la ville. Requête projetée unique (MapId + jour).
        /// </summary>
        private void EnsureTownWritable(int townId, int? day)
        {
            var town = DbContext.Towns
                .Where(town => town.IdTown == townId)
                .Select(town => new { town.MapId, town.Day })
                .Single();
            TownAccessService.EnsureCanWriteTown(townId, town.MapId);
            ThrowIfDayLocked(day, town.Day);
        }

        /// <summary>
        /// Équivalent async d'<see cref="EnsureTownWritable"/>, pour les appels faits sous le verrou par
        /// ville (dans une méthode async déjà entrée dans son <c>await using townLock</c>) : un appel
        /// synchrone y immobiliserait un thread du pool pendant l'I/O au lieu de le libérer.
        /// </summary>
        private async Task EnsureTownWritableAsync(int townId, int? day)
        {
            var town = await DbContext.Towns
                .Where(town => town.IdTown == townId)
                .Select(town => new { town.MapId, town.Day })
                .SingleAsync();
            await TownAccessService.EnsureCanWriteTownAsync(townId, town.MapId);
            ThrowIfDayLocked(day, town.Day);
        }

        /// <summary>
        /// Rejette toute écriture sur un jour antérieur au jour actuel de la ville, SANS contrôle d'accès :
        /// réservé aux appels dont la ville a déjà été vérifiée. Async pour la même raison que
        /// <see cref="EnsureTownWritableAsync"/>.
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
        /// Vérifie qu'une écriture sur l'expédition est permise (ville accessible, jour non passé). Requête
        /// projetée unique (expédition + ville en un aller-retour) au lieu de deux SELECT séquentiels.
        /// Retourne la ville et sa clé de verrou TownSyncLock, réutilisées par les appelants.
        /// </summary>
        private WritableTown EnsureExpeditionWritable(int expeditionId)
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
            return EnsureProjectedTownWritable(expedition.IdTown, expedition.MapId, expedition.Day, expedition.TownDay);
        }

        /// <summary>
        /// Équivalent d'<see cref="EnsureExpeditionWritable"/> pour une partie d'expédition. Requête projetée
        /// unique (partie + expédition + ville) au lieu de trois SELECT séquentiels.
        /// </summary>
        private WritableTown EnsurePartWritable(int expeditionPartId)
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
            return EnsureProjectedTownWritable(part.IdTown, part.MapId, part.Day, part.TownDay);
        }

        /// <summary>
        /// Équivalent d'<see cref="EnsureExpeditionWritable"/> pour un citoyen d'expédition. Requête projetée
        /// unique (citoyen + partie + expédition + ville) au lieu de quatre SELECT séquentiels.
        /// </summary>
        private WritableTown EnsureCitizenWritable(int expeditionCitizenId)
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
            return EnsureProjectedTownWritable(citizen.IdTown, citizen.MapId, citizen.Day, citizen.TownDay);
        }

        /// <summary>
        /// Contrôle commun aux requêtes projetées ci-dessus. Une entité sans ville (chaîne de clés étrangères
        /// cassée) est refusée : aucun citoyen ne peut en revendiquer l'accès.
        /// </summary>
        private WritableTown EnsureProjectedTownWritable(int? idTown, int? mapId, int? day, int? townDay)
        {
            if (!idTown.HasValue || !townDay.HasValue)
            {
                throw new MhoForbiddenException("Cette expédition n'est rattachée à aucune ville.");
            }
            TownAccessService.EnsureCanWriteTown(idTown.Value, mapId);
            ThrowIfDayLocked(day, townDay.Value);
            return new WritableTown(idTown.Value, ComputeTownLockKey(idTown.Value, mapId));
        }

        /// <summary>
        /// Calcule la clé de verrou TownSyncLock (convention mapId brut négatif, même famille que
        /// MyHordesFetcherService/ExternalToolsService/WishListService/TownService) à partir d'un townId
        /// DÉJÀ résolu façon <see cref="MhoContext.ResolveTownId"/> (positif si synchronisé, -mapId si
        /// provisoire) et du MapId joint dans la même requête pour une ville synchronisée.
        /// </summary>
        private static int ComputeTownLockKey(int resolvedIdTown, int? mapId)
        {
            if (resolvedIdTown < 0)
            {
                // Ville provisoire : resolvedIdTown vaut déjà -mapId (cf. ResolveTownId), ne pas le
                // négater une seconde fois sous peine de retomber sur +mapId.
                return resolvedIdTown;
            }
            // Ville synchronisée : verrouiller sur le mapId brut, jamais sur l'IdTown interne résolu,
            // pour s'exclure mutuellement avec une synchro/login concurrente sur la même ville.
            // Repli dégradé sur -resolvedIdTown si MapId est inconnu (ne devrait pas arriver en pratique
            // pour une ville synchronisée) : ne s'exclut pas avec la famille synchro/login, mais reste
            // préférable à planter.
            return mapId.HasValue ? -mapId.Value : -resolvedIdTown;
        }

        /// <summary>
        /// Vérifie qu'une écriture sur la consigne est permise. Une consigne appartient soit à un citoyen,
        /// soit directement à une ou plusieurs parties (cf. ExpeditionMappingProfiles) : chaque expédition
        /// concernée doit être accessible et de jour non passé. Une consigne sans ville est refusée.
        /// </summary>
        private void EnsureOrderWritable(ExpeditionOrder order)
        {
            List<Expedition?> expeditions = order.IdExpeditionCitizenNavigation is not null
                ? new List<Expedition?> { order.IdExpeditionCitizenNavigation.IdExpeditionPartNavigation?.IdExpeditionNavigation }
                : order.IdExpeditionParts.Select(part => part.IdExpeditionNavigation).ToList();
            if (expeditions.Count == 0)
            {
                throw new MhoForbiddenException($"La consigne {order.IdExpeditionOrder} n'est rattachée à aucune expédition.");
            }
            foreach (var expedition in expeditions)
            {
                if (expedition?.IdTown is null)
                {
                    throw new MhoForbiddenException($"La consigne {order.IdExpeditionOrder} n'est rattachée à aucune ville.");
                }
                EnsureTownWritable(expedition.IdTown.Value, expedition.Day);
            }
        }

        /// <summary>
        /// Les DTO de requête portent des identifiants (parties, citoyens, consignes, sac) que le mapping
        /// charge tels quels depuis la base puis rattache à l'entité enregistrée : chacun doit appartenir à
        /// la ville de la cible, sinon une écriture modifierait ou déplacerait les données d'une autre ville.
        /// Un identifiant inexistant est ignoré ici, comme par le mapping.
        /// </summary>
        private async Task EnsurePartsBelongToTownAsync(List<int>? partIds, int idTown)
        {
            if (partIds is null || partIds.Count == 0)
            {
                return;
            }
            var hasForeignPart = await DbContext.ExpeditionParts
                .AnyAsync(part => partIds.Contains(part.IdExpeditionPart) && part.IdExpeditionNavigation.IdTown != idTown);
            if (hasForeignPart)
            {
                throw new MhoForbiddenException($"Une des parties d'expédition [{string.Join(", ", partIds)}] n'appartient pas à la ville {idTown}.");
            }
        }

        /// <inheritdoc cref="EnsurePartsBelongToTownAsync"/>
        private async Task EnsureCitizensBelongToTownAsync(List<int>? citizenIds, int idTown)
        {
            if (citizenIds is null || citizenIds.Count == 0)
            {
                return;
            }
            var hasForeignCitizen = await DbContext.ExpeditionCitizens
                .AnyAsync(citizen => citizenIds.Contains(citizen.IdExpeditionCitizen)
                    && citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.IdTown != idTown);
            if (hasForeignCitizen)
            {
                throw new MhoForbiddenException($"Un des citoyens d'expédition [{string.Join(", ", citizenIds)}] n'appartient pas à la ville {idTown}.");
            }
        }

        /// <inheritdoc cref="EnsurePartsBelongToTownAsync"/>
        private async Task EnsureOrdersBelongToTownAsync(List<int>? orderIds, int idTown)
        {
            if (orderIds is null || orderIds.Count == 0)
            {
                return;
            }
            // Une consigne appartient à des parties (table de liaison) ou à un citoyen : étrangère si ni l'un
            // ni l'autre n'est de la ville.
            var hasForeignOrder = await DbContext.ExpeditionOrders
                .Where(order => orderIds.Contains(order.IdExpeditionOrder))
                .AnyAsync(order => !order.IdExpeditionParts.Any(part => part.IdExpeditionNavigation.IdTown == idTown)
                    && order.IdExpeditionCitizenNavigation.IdExpeditionPartNavigation.IdExpeditionNavigation.IdTown != idTown);
            if (hasForeignOrder)
            {
                throw new MhoForbiddenException($"Une des consignes [{string.Join(", ", orderIds)}] n'appartient pas à la ville {idTown}.");
            }
        }

        /// <summary>
        /// Un sac peut être partagé entre citoyens d'expédition (ExpeditionBag.ExpeditionCitizens) : tous
        /// doivent être de la ville. Un sac sans citoyen, ou inexistant, est refusé faute de ville à vérifier.
        /// </summary>
        private async Task EnsureBagBelongsToTownAsync(int? bagId, int idTown)
        {
            if (!bagId.HasValue)
            {
                return;
            }
            var bagTownIds = await DbContext.ExpeditionCitizens
                .Where(citizen => citizen.IdExpeditionBag == bagId.Value)
                .Select(citizen => citizen.IdExpeditionPartNavigation.IdExpeditionNavigation.IdTown)
                .Distinct()
                .ToListAsync();
            if (bagTownIds.Count != 1 || bagTownIds[0] != idTown)
            {
                throw new MhoForbiddenException($"Le sac d'expédition {bagId} n'appartient pas à la ville {idTown}.");
            }
        }
    }
}
