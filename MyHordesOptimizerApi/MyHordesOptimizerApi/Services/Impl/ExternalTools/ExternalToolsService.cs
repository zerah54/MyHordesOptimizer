using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Comparer;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.MajCase;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.FataMorgana;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Extensions.Models;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.ExternalTools;
using MyHordesOptimizerApi.Models.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.ExternalTools
{
    public class ExternalToolsService : IExternalToolsService
    {
        protected ILogger<ExternalToolsService> Logger { get; private set; }
        protected IBigBrothHordesRepository BigBrothHordesRepository { get; private set; }
        protected IFataMorganaRepository FataMorganaRepository { get; private set; }
        protected IGestHordesRepository GestHordesRepository { get; private set; }
        protected IMyHordesApiRepository MyHordesApiRepository { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected TownSyncLock TownSyncLock { get; private set; }


        public ExternalToolsService(ILogger<ExternalToolsService> logger,
            IBigBrothHordesRepository bigBrothHordesRepository,
            IFataMorganaRepository fataMorganaRepository,
            IGestHordesRepository gestHordesRepository,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            IServiceScopeFactory serviceScopeFactory,
            IMyHordesApiRepository myHordesApiRepository,
            TownSyncLock townSyncLock)
        {
            Logger = logger;
            BigBrothHordesRepository = bigBrothHordesRepository;
            FataMorganaRepository = fataMorganaRepository;
            GestHordesRepository = gestHordesRepository;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            ServiceScopeFactory = serviceScopeFactory;
            MyHordesApiRepository = myHordesApiRepository;
            TownSyncLock = townSyncLock;
        }

        public async Task<UpdateResponseDto> UpdateExternalsTools(UpdateRequestDto updateRequestDto, IExternalToolsProgressSink sink = null)
        {
            sink ??= NullExternalToolsProgressSink.Instance;
            var plan = ExternalToolsUpdatePlan.Build(updateRequestDto);
            var response = new UpdateResponseDto(updateRequestDto);
            var townDetails = updateRequestDto.TownDetails;
            var tasks = new List<Task>();

            // BBH, Fata et GH ne lisent ni le townId résolu ni le LastUpdateInfo MHO (préambule
            // ci-dessous) : elles démarrent donc immédiatement, sans attendre les deux allers-retours
            // DB qui ne concernent que MyHordes Optimizer.
            if (plan.Bbh)
            {
                var bbhTask = Task.Run(() =>
                {
                    try
                    {
                        BigBrothHordesRepository.Update();
                        sink.Succeeded(ExternalToolId.BigBrothHordes, ExternalToolUpdateUnits.Map);
                    }
                    catch (WebApiException e)
                    {
                        Logger.LogWarning($"Exception pendant la maj globale BBH : {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.BigBrothHordesStatus = $"{e.Message} : {e.Response}";
                        sink.Failed(ExternalToolId.BigBrothHordes, ExternalToolUpdateUnits.Map, $"{e.Message} : {e.Response}");
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la maj globale BBH : {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.BigBrothHordesStatus = e.Message;
                        sink.Failed(ExternalToolId.BigBrothHordes, ExternalToolUpdateUnits.Map, e.Message);
                    }
                });
                tasks.Add(bbhTask);
            }
            if (plan.Fata)
            {
                var fataTask = Task.Run(async () =>
                {
                    try
                    {
                        var fataRequestDto = Mapper.Map<FataMorganaUpdateRequestDto>(updateRequestDto);
                        fataRequestDto.UserId = UserInfoProvider.UserId;
                        fataRequestDto.UserKey = UserInfoProvider.UserKey;
                        await FataMorganaRepository.UpdateAsync(fataRequestDto);
                        sink.Succeeded(ExternalToolId.FataMorgana, ExternalToolUpdateUnits.Map);
                    }
                    catch (WebApiException e)
                    {
                        Logger.LogWarning($"Exception pendant la maj globale Fata : {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.FataMorganaStatus = $"{e.Message} : {e.Response}";
                        sink.Failed(ExternalToolId.FataMorgana, ExternalToolUpdateUnits.Map, $"{e.Message} : {e.Response}");
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la maj globale Fata : {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.FataMorganaStatus = e.Message;
                        sink.Failed(ExternalToolId.FataMorgana, ExternalToolUpdateUnits.Map, e.Message);
                    }
                });
                tasks.Add(fataTask);
            }
            if (plan.GhMap)
            {
                var ghTask = Task.Run(() =>
                {
                    var ghFailed = false;
                    try
                    {
                        GestHordesRepository.Update();
                    }
                    catch (WebApiException e)
                    {
                        Logger.LogWarning($"Exception pendant la maj api GH :  {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.GestHordesApiStatus = $"{e.Message} : {e.Response}";
                        sink.Failed(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map, $"{e.Message} : {e.Response}");
                        ghFailed = true;
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la maj api GH :  {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.GestHordesApiStatus = e.Message;
                        sink.Failed(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map, e.Message);
                        ghFailed = true;
                    }

                    if (UpdateRequestMapToolsToUpdateDetailsDto.IsCell(updateRequestDto.Map.ToolsToUpdate.IsGestHordes))
                    {
                        try
                        {
                            var cell = updateRequestDto.Map.Cell;
                            var realX = updateRequestDto.TownDetails.TownX + cell.X;
                            var realY = updateRequestDto.TownDetails.TownY - cell.Y;
                            if (townDetails.IsChaos || cell.DeadZombies > 0)
                            {

                                if (cell.Objects != null && townDetails.IsChaos)
                                {
                                    var request = Mapper.Map<GestHordesMajCaseRequestDto>(updateRequestDto);
                                    GestHordesRepository.UpdateCellItem(request);
                                }

                                if (cell.DeadZombies > 0)
                                {
                                    var request = Mapper.Map<GestHordesMajCaseZombiesDto>(updateRequestDto);
                                    GestHordesRepository.UpdateCellZombies(request);
                                }
                            }
                        }
                        catch (WebApiException e)
                        {
                            Logger.LogWarning($"Exception pendant la maj cell GH : {e} => {updateRequestDto.ToJson()}");
                            response.MapResponseDto.GestHordesCellsStatus = $"{e.Message} : {e.Response}";
                            // L'appel API ci-dessus a pu déjà échouer, sur la même unité GhMap : dans ce cas
                            // AddError ajoute ce message sans redécompter l'unité (déjà décomptée par le
                            // premier Failed). Sinon (API réussie), c'est le premier échec de l'unité : il
                            // doit la décompter via Failed, sans quoi son PendingUnits ne retombe jamais à 0.
                            if (ghFailed) sink.AddError(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map, $"{e.Message} : {e.Response}");
                            else sink.Failed(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map, $"{e.Message} : {e.Response}");
                            ghFailed = true;
                        }
                        catch (Exception e)
                        {
                            Logger.LogWarning($"Exception pendant la maj cell GH : {e} => {updateRequestDto.ToJson()}");
                            response.MapResponseDto.GestHordesCellsStatus = e.Message;
                            if (ghFailed) sink.AddError(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map, e.Message);
                            else sink.Failed(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map, e.Message);
                            ghFailed = true;
                        }
                    }

                    // Une seule fin pour une seule unité : sans ce garde-fou, un envoi réussi après un envoi
                    // en échec redonnerait une notification de succès sur une unité déjà close.
                    if (!ghFailed)
                    {
                        sink.Succeeded(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map);
                    }
                });
                tasks.Add(ghTask);
            }

            // Le client envoie toujours le mapId (jamais le townId stable attribué par l'import global) :
            // on résout une fois ici et on réutilise cette valeur dans toutes les tâches parallèles.
            // Ce préalable, comme le LastUpdateInfo, n'est lu que par des unités MyHordes Optimizer :
            // son échec ne doit donc faire tomber que MHO, pas Gest'Hordes ni Fata Morgana.
            var resolvedTownId = 0;
            LastUpdateInfo newLastUpdate = null;
            var mhoPreambleFailed = false;
            if (plan.NeedsTownId)
            {
                try
                {
                    using (var resolveScope = ServiceScopeFactory.CreateScope())
                    {
                        resolvedTownId = resolveScope.ServiceProvider.GetRequiredService<MhoContext>().ResolveTownId(townDetails.TownId);
                    }
                    if (plan.NeedsLastUpdateInfo)
                    {
                        using var scope = ServiceScopeFactory.CreateScope();
                        var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
                        newLastUpdate = dbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(UserInfoProvider.GenerateLastUpdateInfo(), opt => opt.SetDbContext(dbContext))).Entity;
                        dbContext.SaveChanges();
                    }
                }
                catch (Exception e)
                {
                    // Changement de comportement par rapport à l'ancienne route (avant cette refonte) :
                    // une exception ici remontait alors non attrapée jusqu'au contrôleur (HTTP 500).
                    // Désormais elle est rattrapée, et l'ancienne route répond 200 avec un statut
                    // d'erreur porté par MapResponseDto.MhoApiStatus.
                    Logger.LogWarning($"Exception pendant le préalable MHO : {e} => {updateRequestDto.ToJson()}");
                    sink.FailAllPending(ExternalToolUpdateUnits.Map, e.Message, ExternalToolId.MyHordesOptimizer);
                    response.MapResponseDto.MhoApiStatus = e.Message;
                    mhoPreambleFailed = true;
                }
            }

            #region Maps
            // Référencée par les tâches Bags/Citizen/Digs ci-dessous : elles écrivent les mêmes
            // lignes (TownCitizens, MapCells/MapCellDigs) que mhoTask et doivent attendre sa fin
            // avant de démarrer, sans quoi leur résultat dépend de l'ordre d'exécution des tâches.
            Task mhoTask = null;
            if (plan.MhoMap && !mhoPreambleFailed)
            {
                mhoTask = Task.Run(async () =>
                {
                    try
                    {
                        var me = MyHordesApiRepository.GetMapForToolsUpdate();

                        // Même clé que le login (GetSimpleMeAsync) : le mapId, jamais le townId
                        // résolu. Sans cet alignement, ce chemin et le login verrouillent deux
                        // sémaphores différents pour la même ville et ne s'excluent pas mutuellement.
                        await using var townLock = await TownSyncLock.AcquireTownAsync(-townDetails.TownId);

                        using var scope = ServiceScopeFactory.CreateScope();
                        var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
                        using var transaction = dbContext.Database.BeginTransaction();

                        var zones = me.Map.Zones;
                        var listCells = new List<MapCell>();
                        var listCellItems = new List<MapCellItem>();
                        var driedCell = new List<MapCell>();

                        var townId = resolvedTownId;

                        var townEntity = dbContext.Towns
                            .Include(town => town.TownCitizens)
                            .Include(town => town.TownCadavers)
                            .FirstOrDefault(town => town.IdTown == townId);
                        if (townEntity != null)
                        {
                            // Mise à jour centralisée : on exploite tout le /json/me déjà payé
                            // (day, puits, porte, dimensions, coordonnées...), pas seulement 6 champs
                            townEntity.UpdateFromMapDetails(me.Map);
                            // Appel SÉPARÉ, et réservé à /json/me : c'est la seule source qui demande
                            // les trois rôles, et leur absence y signifie « plus personne ».
                            townEntity.UpdateRolesFromMapDetails(me.Map);
                            if (me.MapId > 0)
                            {
                                townEntity.MapId = me.MapId;
                            }
                            // Garde-fou : le joueur qui met à jour est dans cette ville, elle ne peut pas être terminée
                            townEntity.IsFinished = false;
                            dbContext.Update(townEntity);

                            // Citoyens, cadavres et banque : jusqu'ici seul le login (GetSimpleMeAsync)
                            // les persistait, ce chemin les laissait périmer entre deux connexions.
                            foreach (var myHordeCitizen in me.Map.Citizens ?? new List<MyHordesUserDto>())
                            {
                                var mappedCitizen = Mapper.Map<TownCitizen>(myHordeCitizen, opt => opt.SetDbContext(dbContext));
                                var existingCitizen = townEntity.TownCitizens.FirstOrDefault(citizen => citizen.IdUser == mappedCitizen.IdUser);
                                if (existingCitizen == null)
                                {
                                    mappedCitizen.IdTown = townId;
                                    mappedCitizen.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
                                    dbContext.Add(mappedCitizen);
                                }
                                else
                                {
                                    existingCitizen.UpdateAllButKeysProperties(mappedCitizen, ignoreNull: true);
                                    existingCitizen.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
                                }
                            }
                            // Les citoyens passés côté cadavres ne sont plus listés dans map.citizens :
                            // on marque leur ligne comme morte au lieu de la perdre (même logique que le login).
                            foreach (var myHordeCadaver in (me.Map.Cadavers ?? new List<MyHordesCitizenRankingDto>()).Where(cadaver => cadaver.Id.HasValue))
                            {
                                var mappedCadaver = Mapper.Map<TownCadaver>(myHordeCadaver, opt => opt.SetDbContext(dbContext));
                                var deadCitizen = townEntity.TownCitizens.FirstOrDefault(citizen => citizen.IdUser == mappedCadaver.IdUser);
                                if (deadCitizen != null)
                                {
                                    deadCitizen.Dead = true;
                                }
                                var existingCadaver = townEntity.TownCadavers.FirstOrDefault(cadaver => cadaver.IdUser == mappedCadaver.IdUser);
                                if (existingCadaver == null)
                                {
                                    mappedCadaver.IdTown = townId;
                                    mappedCadaver.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
                                    dbContext.Add(mappedCadaver);
                                }
                                else
                                {
                                    existingCadaver.UpdateAllButKeysProperties(mappedCadaver, ignoreNull: true);
                                }
                            }
                            // Banque : nouvelle photo à chaque MAJ, comme le login (pas de suppression
                            // des anciennes lignes, la lecture se fait sur le dernier IdLastUpdateInfo).
                            if (me.Map.City?.Bank != null)
                            {
                                var mappedBankItems = me.Map.City.Bank
                                    .Select(item => Mapper.Map<TownBankItem>(item, opt => opt.SetDbContext(dbContext)))
                                    .Where(item => item.IdItemNavigation != null)
                                    .ToList();
                                foreach (var item in mappedBankItems)
                                {
                                    item.IdTown = townId;
                                    item.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
                                }
                                dbContext.AddRange(mappedBankItems);
                            }
                        }

                        var zoneItemX = -1;
                        var zoneItemY = -1;
                        var allCell = dbContext.MapCells.Where(cell => cell.IdTown == townId)
                                                        .ToList();
                        // Les identifiants de ruine et d'objet portés par la carte sont ceux de
                        // MyHordes : ce sont des auto-incréments de fixtures, ils se traduisent en
                        // clés MHO plutôt que de se recopier. Une entrée dont le mhId n'est pas
                        // encore renseigné est lue sous sa clé, ce qu'elle signifiait avant le
                        // découplage.
                        var clesRuineParMhId = dbContext.Ruins.ToList()
                            .ToDictionary(ruin => ruin.MhId ?? ruin.IdRuin, ruin => ruin.IdRuin);
                        var clesItemParMhId = dbContext.Items.ToList()
                            .ToDictionary(item => item.MhId ?? item.IdItem, item => item.IdItem);
                        // X et Y sont les clés de la case. MyHordes les ajoute d'office, même non
                        // demandés, mais on ne s'appuie pas sur une chaîne `fields=` : sans
                        // coordonnées, la case n'est pas localisable.
                        foreach (var zone in zones.Where(zone => zone.X.HasValue && zone.Y.HasValue))
                        {
                            int? nbHero = null;
                            int? nbZombie = null;
                            bool? isDried = null;

                            // Details est désormais typé : le tableau vide que MyHordes renvoie pour
                            // les cases sans détail est traduit en null par EmptyPhpArrayConverter,
                            // ce qui remplace la désérialisation manuelle qui vivait ici.
                            var details = zone.Details;
                            if (details != null)
                            {
                                nbHero = details.H;
                                nbZombie = details.Z;
                                isDried = details.Dried;
                            }

                            int? averagePotentialRemainingDig = null;
                            int? maxPotentialRemainingDig = null;
                            if (isDried.HasValue && isDried.Value)
                            {
                                averagePotentialRemainingDig = 0;
                                maxPotentialRemainingDig = 0;
                            }
                            // Le sentinel négatif (case enterrée) n'est pas un prototype du jeu :
                            // MHO lui réserve la ruine « bâtiment non déterré », de clé négative
                            // elle aussi. Aucune traduction ne doit y toucher.
                            int? type = zone.Building?.Type;
                            if (type.HasValue && type.Value >= 0)
                            {
                                if (clesRuineParMhId.TryGetValue(type.Value, out var cleRuine))
                                {
                                    type = cleRuine;
                                }
                                else
                                {
                                    Logger.LogWarning("UpdateMap : ruine {MhId} inconnue en {X}/{Y}, case laissée sans bâtiment.",
                                        type.Value, zone.X, zone.Y);
                                    type = null;
                                }
                            }
                            var cellModel = allCell.FirstOrDefault(cell => cell.X == zone.X
                                                                  && cell.Y == zone.Y);
                            var cell = new MapCell()
                            {
                                IdTown = townId,
                                IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo,
                                X = zone.X.Value,
                                Y = zone.Y.Value,
                                IsTown = zone.X == me.Map.City.X && zone.Y == me.Map.City.Y,
                                IsVisitedToday = !Convert.ToBoolean(zone.Nvt),
                                IsNeverVisited = false,
                                DangerLevel = zone.Danger,
                                IsDryed = isDried,
                                IdRuin = type,
                                NbZombie = nbZombie,
                                NbZombieKilled = null,
                                NbHero = nbHero,
                                IsRuinCamped = zone.Building?.Camped,
                                IsRuinDryed = zone.Building?.Dried,
                                NbRuinDig = zone.Building?.Dig,
                                AveragePotentialRemainingDig = averagePotentialRemainingDig,
                                MaxPotentialRemainingDig = maxPotentialRemainingDig,
                                Tag = zone.Tag
                            };
                            if (zone.Items != null)
                            {
                                zoneItemX = zone.X.Value;
                                zoneItemY = zone.Y.Value;
                                // IdItem est une clé étrangère : un objet sans id n'est pas un objet.
                                // On l'ignore plutôt que d'inventer un identifiant.
                                foreach (var item in zone.Items.Where(item => item.Id.HasValue))
                                {
                                    if (!clesItemParMhId.TryGetValue(item.Id.Value, out var cleItem))
                                    {
                                        Logger.LogWarning("UpdateMap : objet {MhId} inconnu en {X}/{Y}, ignoré.",
                                            item.Id.Value, zone.X, zone.Y);
                                        continue;
                                    }
                                    var cellItem = new MapCellItem()
                                    {
                                        Count = item.Count,
                                        IdItem = cleItem,
                                        IsBroken = item.Broken,
                                        IdCell = cellModel.IdCell
                                    };
                                    listCellItems.Add(cellItem);
                                }
                            }
                            cellModel.UpdateAllButKeysProperties(cell, ignoreNull: true);
                            listCells.Add(cellModel);
                        }
                        if (UpdateRequestMapToolsToUpdateDetailsDto.IsCell(updateRequestDto.Map.ToolsToUpdate.IsMyHordesOptimizer) && updateRequestDto.Map.Cell != null)
                        {
                            UpdateCellInfoDto updateCellDto = updateRequestDto.Map.Cell;
                            var realX = updateRequestDto.TownDetails.TownX + updateCellDto.X;
                            var realY = updateRequestDto.TownDetails.TownY - updateCellDto.Y;

                            var cellToUpdate = listCells.Single(cell => cell.X == realX && cell.Y == realY);

                            cellToUpdate.NbZombie = updateCellDto.Zombies;
                            cellToUpdate.NbZombieKilled = updateCellDto.DeadZombies;
                            cellToUpdate.IsDryed = updateCellDto.ZoneEmpty;

                            listCellItems.Clear();
                            var items = Mapper.Map<List<MapCellItem>>(updateCellDto.Objects);
                            items.ForEach(item => item.IdCell = cellToUpdate.IdCell);
                            listCellItems.AddRange(items);

                            // Relevés des métiers Fouineur et Éclaireur : ils portent sur la case
                            // courante et sur les quatre cases adjacentes, d'où l'application sur
                            // l'ensemble des cases de la ville et non sur la seule case courante.
                            allCell.ApplyJobRadars(realX,
                                realY,
                                updateCellDto.ScavZoneLevel,
                                updateCellDto.ScoutZoneLvl,
                                updateCellDto.ScavNextCells,
                                updateCellDto.ScoutNextCells,
                                newLastUpdate.IdLastUpdateInfo);

                            if (updateCellDto.CitizenId.Any())
                            {
                                var citizenModels = dbContext.TownCitizens.Where(citizen => citizen.IdTown == townId
                                                                                 && updateCellDto.CitizenId.Contains(citizen.IdUser))
                                                                         .ToList();
                                foreach (var citizen in citizenModels)
                                {
                                    citizen.PositionX = realX;
                                    citizen.PositionY = realY;
                                    citizen.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
                                }
                                dbContext.SaveChanges();
                            }
                        }
                        var mapCellEqualityComaprer = new MapCellEqualityComaprer();
                        foreach (var cellToUpdate in listCells)
                        {
                            var cellModel = allCell.FirstOrDefault(cell => cell.X == cellToUpdate.X
                                                                    && cell.Y == cellToUpdate.Y);
                            if (cellModel == null)
                            {
                                dbContext.Add(cellToUpdate);
                            }
                            else
                            {
                                if (!mapCellEqualityComaprer.Equals(cellModel, cellToUpdate))
                                {
                                    cellModel.UpdateAllButKeysProperties(cellToUpdate);
                                    dbContext.Update(cellModel);
                                }
                            }
                        }
                        dbContext.MapCellDigs.RemoveRange(dbContext.MapCellDigs.Where(dig => listCells.Select(x => x.IdCell).Contains(dig.IdCell)));
                        if (zoneItemX != -1 && zoneItemY != -1)
                        {
                            dbContext.MapCellItems.RemoveRange(dbContext.MapCellItems.Where(cellItem => listCellItems.Select(x => x.IdCell).Contains(cellItem.IdCell)));
                            dbContext.MapCellItems.AddRange(listCellItems);
                        }
                        dbContext.SaveChanges();
                        transaction.Commit();
                        sink.Succeeded(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map);
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la maj map MHO {e.ToString()} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.MhoApiStatus = e.Message;
                        sink.Failed(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map, e.Message);
                    }
                });
                tasks.Add(mhoTask);
            }
            #endregion

            #region Bag
            if (plan.MhoBags && !mhoPreambleFailed)
            {
                var mHOBagTask = Task.Run(async () =>
                {
                    try
                    {
                        // mhoTask écrit aussi TownCitizens pour cette ville : on attend sa fin avant
                        // d'y toucher, puis on prend le même verrou pour s'exclure d'un autre joueur
                        // de la même ville en train de faire la même mise à jour.
                        if (mhoTask != null) await mhoTask;
                        await using var townLock = await TownSyncLock.AcquireTownAsync(-townDetails.TownId);

                        UpdateBags(resolvedTownId, updateRequestDto.Bags.Contents);
                        sink.Succeeded(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Bags);
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la MAJ des sacs de MHO : {e.ToString()} => {updateRequestDto.ToJson()}");
                        response.BagsResponseDto.MhoStatus = e.Message;
                        sink.Failed(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Bags, e.Message);
                    }
                });
                tasks.Add(mHOBagTask);
            }
            #endregion

            #region Citizen

            try
            {
                var townCitizenDetail = new TownCitizen()
                {
                    IdTown = resolvedTownId,
                    IdUser = UserInfoProvider.UserId
                };
                var ghUpdateCitizenRequest = new GestHordesMajCitizenRequest(UserInfoProvider.UserId, UserInfoProvider.UserKey);

                var patchHomeMho = false;
                var patchHomeGh = false;
                if (updateRequestDto.Amelios != null)
                {
                    if (updateRequestDto.Amelios.ToolsToUpdate.IsMyHordesOptimizer)
                    {
                        var homeDetail = Mapper.Map<TownCitizen>(updateRequestDto.Amelios.Values);
                        townCitizenDetail.ImportHomeDetail(homeDetail);
                        patchHomeMho = true;
                    }
                    if (updateRequestDto.Amelios.ToolsToUpdate.IsGestHordes)
                    {
                        ghUpdateCitizenRequest.Maison = Mapper.Map<GestHordesMajCitizenMaisonDto>(updateRequestDto.Amelios.Values);
                        patchHomeGh = true;
                    }
                }

                var patchHeroicActionMho = false;
                var patchHeroicActionGh = false;
                if (updateRequestDto.HeroicActions != null)
                {
                    var heroicActionDetail = GetHeroicActionCitizenDetail(updateRequestDto.HeroicActions.Actions);
                    if (updateRequestDto.HeroicActions.ToolsToUpdate.IsMyHordesOptimizer)
                    {
                        townCitizenDetail.ImportHeroicActionDetail(heroicActionDetail);
                        patchHeroicActionMho = true;
                    }
                    if (updateRequestDto.HeroicActions.ToolsToUpdate.IsGestHordes)
                    {
                        var ghActionHero = Mapper.Map<GestHordesMajCitizenActionsHeroDto>(heroicActionDetail);
                        ghUpdateCitizenRequest.ActionsHero.ImportHeroicActionDetail(ghActionHero);
                        patchHeroicActionGh = true;
                    }
                }

                var patchStatusMho = false;
                var patchStatusGh = false;
                if (updateRequestDto.Status != null)
                {
                    var statusDetail = GetTownCitizenStatusDetail(updateRequestDto.Status.Values);
                    if (updateRequestDto.Status.ToolsToUpdate.IsMyHordesOptimizer)
                    {
                        townCitizenDetail.ImportStatusDetail(statusDetail);
                        patchStatusMho = true;
                    }
                    if (updateRequestDto.Status.ToolsToUpdate.IsGestHordes)
                    {
                        var ghStatus = Mapper.Map<GestHordesMajCitizenActionsHeroDto>(statusDetail);
                        ghUpdateCitizenRequest.ActionsHero.ImportStatusDetail(ghStatus);
                        patchStatusGh = true;
                    }
                }

                if (plan.MhoCitizen && !mhoPreambleFailed)
                {
                    var mHOCitizenDetailTask = Task.Run(async () =>
                    {
                        try
                        {
                            // mhoTask écrit aussi la ligne TownCitizens du joueur courant : on attend
                            // sa fin, puis on prend le même verrou par ville qu'elle (autre joueur de
                            // la même ville en train de synchroniser en parallèle).
                            if (mhoTask != null) await mhoTask;
                            await using var townLock = await TownSyncLock.AcquireTownAsync(-townDetails.TownId);

                            using var scope = ServiceScopeFactory.CreateScope();
                            var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
                            using var transaction = dbContext.Database.BeginTransaction();
                            if (patchHomeMho)
                            {
                                townCitizenDetail.IdLastUpdateInfoHome = newLastUpdate.IdLastUpdateInfo;
                            }
                            if (patchStatusMho)
                            {
                                townCitizenDetail.IdLastUpdateInfoStatus = newLastUpdate.IdLastUpdateInfo;
                            }
                            if (patchHeroicActionMho)
                            {
                                townCitizenDetail.IdLastUpdateInfoHeroicAction = newLastUpdate.IdLastUpdateInfo;
                            }
                            var citizenDetail = dbContext.TownCitizens.Single(citizen => citizen.IdTown == townCitizenDetail.IdTown && citizen.IdUser == townCitizenDetail.IdUser);
                            citizenDetail.UpdateAllButKeysProperties(townCitizenDetail, ignoreNull: true);
                            dbContext.Update(citizenDetail);
                            dbContext.SaveChanges();
                            transaction.Commit();
                            sink.Succeeded(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Citizen);
                        }
                        catch (Exception e)
                        {
                            Logger.LogWarning($"Exception pendant la MAJ du détail d'un citizen MHO : {e.ToString()} => {updateRequestDto.ToJson()}");
                            response.HeroicActionsResponseDto.MhoStatus = e.Message;
                            response.StatusResponseDto.MhoStatus = e.Message;
                            response.HomeResponseDto.MhoStatus = e.Message;
                            sink.Failed(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Citizen, e.Message);
                        }
                    });
                    tasks.Add(mHOCitizenDetailTask);
                }

                if (plan.GhCitizen)
                {
                    var gHCitizenDetailTask = Task.Run(() =>
                    {
                        try
                        {
                            GestHordesRepository.UpdateCitizen(ghUpdateCitizenRequest);
                            sink.Succeeded(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Citizen);
                        }
                        catch (Exception e)
                        {
                            Logger.LogWarning($"Exception pendant la MAJ du détail d'un citizen GH : {e.ToString()} => {updateRequestDto.ToJson()}");
                            response.HeroicActionsResponseDto.GestHordesStatus = e.Message;
                            response.StatusResponseDto.GestHordesStatus = e.Message;
                            response.HomeResponseDto.GestHordesStatus = e.Message;
                            sink.Failed(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Citizen, e.Message);
                        }
                    });
                    tasks.Add(gHCitizenDetailTask);
                }
            }
            catch (Exception e)
            {
                Logger.LogWarning($"Exception inconue : {e.ToString()} => {updateRequestDto.ToJson()}");
                response.HeroicActionsResponseDto.MhoStatus = e.Message;
                response.HeroicActionsResponseDto.GestHordesStatus = e.Message;
                response.StatusResponseDto.MhoStatus = e.Message;
                response.HomeResponseDto.MhoStatus = e.Message;
                response.HomeResponseDto.GestHordesStatus = e.Message;
                // Un Failed sur une unité non déclarée volerait le solde d'une autre unité du même
                // outil (ex. la Map de MHO encore en cours) : ne notifier que les unités du plan.
                if (plan.MhoCitizen) sink.Failed(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Citizen, e.Message);
                if (plan.GhCitizen) sink.Failed(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Citizen, e.Message);
            }

            #endregion

            #region SuccesDig

            if (plan.MhoDigs && !mhoPreambleFailed)
            {
                var digsTask = Task.Run(async () =>
                {
                    var successedDig = updateRequestDto.SuccessedDig;
                    try
                    {
                        // mhoTask vide MapCellDigs pour toutes les cases de la carte reçue avant d'y
                        // réinsérer : sans cet ordre, une exécution concurrente peut effacer la ligne
                        // que digsTask vient d'écrire. On attend sa fin, puis on prend le même verrou
                        // par ville (autre joueur de la même ville en train de synchroniser).
                        if (mhoTask != null) await mhoTask;
                        await using var townLock = await TownSyncLock.AcquireTownAsync(-townDetails.TownId);

                        using var scope = ServiceScopeFactory.CreateScope();
                        var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
                        using var transaction = dbContext.Database.BeginTransaction();

                        var cellDigsToUpdate = new List<MapCellDig>();
                        var realX = updateRequestDto.TownDetails.TownX + successedDig.Cell.X;
                        var realY = updateRequestDto.TownDetails.TownY - successedDig.Cell.Y;
                        var townId = resolvedTownId;

                        var cellId = dbContext.MapCells.Where(cell => cell.IdTown == townId
                                                                         && cell.X == realX
                                                                         && cell.Y == realY)
                                                                    .Select(cell => cell.IdCell)
                                                                    .Single();
                        foreach (var dig in successedDig.Values)
                        {
                            var cellDigModel = dbContext.MapCellDigs.Where(cellDig => cellDig.IdCellNavigation.IdTown == townId
                                                                           && cellDig.Day == successedDig.Cell.Day
                                                                           && cellDig.IdCellNavigation.X == realX
                                                                           && cellDig.IdCellNavigation.Y == realY
                                                                           && cellDig.IdUser == dig.CitizenId)
                                                                     .FirstOrDefault();
                            if (cellDigModel == null)
                            {
                                cellDigModel = new MapCellDig()
                                {
                                    Day = successedDig.Cell.Day,
                                    IdCell = cellId,
                                    IdUser = dig.CitizenId,
                                    NbSucces = dig.SuccessDigs,
                                    NbTotalDig = dig.TotalDigs,
                                    IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo
                                };
                                dbContext.Add(cellDigModel);
                            }
                            else
                            {
                                cellDigModel.Day = successedDig.Cell.Day;
                                cellDigModel.IdUser = dig.CitizenId;
                                cellDigModel.NbSucces = dig.SuccessDigs;
                                cellDigModel.NbTotalDig = dig.TotalDigs;
                                cellDigModel.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
                                dbContext.Update(cellDigModel);
                            }
                        }
                        dbContext.SaveChanges();
                        transaction.Commit();
                        sink.Succeeded(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Digs);
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la MAJ des digs de MHO : {e.ToString()} => {updateRequestDto.ToJson()}");
                        response.DigResponseDto.MhoStatus = e.Message;
                        sink.Failed(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Digs, e.Message);
                    }
                });
                tasks.Add(digsTask);
            }

            #endregion

            await Task.WhenAll(tasks);
            return response;
        }

        public List<CaseGH> UpdateGHZoneRegen(UpdateZoneRegenDto requestDto)
        {
            var xVille = requestDto.TownX;
            var yVille = requestDto.TownY;
            var totalX = requestDto.MapNbX;
            var totalY = requestDto.MapNbY;
            var zone = requestDto.Direction;
            var casesRegen = new List<CaseGH>();

            switch (zone)
            {
                case "N":
                    casesRegen = GetRegenNord(requestDto);
                    break;
                case "NE":
                    var zoneNord = GetRegenNord(requestDto);
                    var zoneEst = GetRegenEst(requestDto);
                    for (var y = yVille - 1; y >= 0; y--)
                    {
                        for (var x = xVille + 1; x < totalX; x++)
                        {
                            casesRegen.Add(new CaseGH(x, y));
                        }
                    }
                    casesRegen.RemoveAll(zone => zoneNord.Contains(zone) || zoneEst.Contains(zone));
                    break;
                case "E":
                    casesRegen = GetRegenEst(requestDto);
                    break;
                case "S":
                    casesRegen = GetRegenSud(requestDto);
                    break;
                case "SE":
                    var zoneSud = GetRegenSud(requestDto);
                    zoneEst = GetRegenEst(requestDto);
                    for (var y = yVille + 1; y < totalY; y++)
                    {
                        for (var x = xVille + 1; x < totalX; x++)
                        {
                            casesRegen.Add(new CaseGH(x, y));
                        }
                    }
                    casesRegen.RemoveAll(zone => zoneSud.Contains(zone) || zoneEst.Contains(zone));
                    break;
                case "SW":
                    zoneSud = GetRegenSud(requestDto);
                    var zoneOuest = GetRegenOuest(requestDto);
                    zoneOuest = GetRegenOuest(requestDto);
                    for (var y = yVille + 1; y < totalY; y++)
                    {
                        for (var x = xVille + -1; x >= 0; x--)
                        {
                            casesRegen.Add(new CaseGH(x, y));
                        }
                    }
                    casesRegen.RemoveAll(zone => zoneSud.Contains(zone) || zoneOuest.Contains(zone));
                    break;
                case "W":
                    casesRegen = GetRegenOuest(requestDto);
                    break;
                case "NW":
                    zoneNord = GetRegenNord(requestDto);
                    zoneOuest = GetRegenOuest(requestDto);
                    for (var y = yVille - 1; y >= 0; y--)
                    {
                        for (var x = xVille + -1; x >= 0; x--)
                        {
                            casesRegen.Add(new CaseGH(x, y));
                        }
                    }
                    casesRegen.RemoveAll(zone => zoneNord.Contains(zone) || zoneOuest.Contains(zone));
                    break;
            }
            List<dynamic> cellToUpdate = requestDto.DynamicsCells.Where(cell => casesRegen.Any(caseRegen => cell.x == caseRegen.X && cell.y == caseRegen.Y)).ToList();
            foreach (var cell in cellToUpdate)
            {
                var jObject = cell as JObject;
                var nbPelle = 0;
                var idPelle = -1;
                var idMax = -1;
                foreach (var key in jObject.Children())
                {
                    var prop = key as JProperty;
                    if (prop != null && prop.Name.IndexOf("idObjet") > 0)
                    {
                        Match match = Regex.Match(prop.Name, "(\\d+)");
                        var idObj = int.Parse(match.Value);
                        if (idObj > idMax)
                        {
                            idMax = idObj;
                        }
                        var value = prop.Value;
                        if (value.Value<string>() == "5001")
                        {
                            idPelle = idObj;
                            nbPelle = jObject.Property($"dataObjet[{idPelle}][nbr]").Value.Value<int>();
                        }
                    }
                }
                nbPelle++;
                if (idPelle == -1)
                {
                    jObject.Add(new JProperty($"dataObjet[{idMax + 1}][nbr]", nbPelle));
                    jObject.Add(new JProperty($"dataObjet[{idMax + 1}][idObjet]", 5001));
                    jObject.Add(new JProperty($"dataObjet[{idMax + 1}][type]", 4));
                }
                else
                {
                    jObject[$"dataObjet[{idPelle}][nbr]"] = nbPelle;
                }
            }
            GestHordesRepository.UpdateGHZoneRegen(requestDto.PHPSESSID, cellToUpdate);
            return casesRegen;
        }

        #region GH

        #region ZoneRegen

        private List<CaseGH> GetRegenNord(UpdateZoneRegenDto requestDto)
        {
            var xVille = requestDto.TownX;
            var yVille = requestDto.TownY;
            var totalX = requestDto.MapNbX;
            var totalY = requestDto.MapNbY;
            var casesRegen = new List<CaseGH>();
            var count = 0;

            for (var y = yVille - 1; y >= 0; y--)
            {
                count++;
                int offSet = count / 2;
                for (var x = xVille - offSet; x <= xVille + offSet; x++)
                {
                    if (x >= 0 && x <= totalX)
                    {
                        casesRegen.Add(new CaseGH(x, y));
                    }
                }
            }
            return casesRegen;
        }

        private List<CaseGH> GetRegenEst(UpdateZoneRegenDto requestDto)
        {
            var xVille = requestDto.TownX;
            var yVille = requestDto.TownY;
            var totalX = requestDto.MapNbX;
            var totalY = requestDto.MapNbY;
            var casesRegen = new List<CaseGH>();
            var count = 0;

            for (var x = xVille + 1; x < totalX; x++)
            {
                count++;
                int offSet = count / 2;
                for (var y = yVille - offSet; y <= yVille + offSet; y++)
                {
                    if (x >= 0 && x <= totalX)
                    {
                        casesRegen.Add(new CaseGH(x, y));
                    }
                }
            }
            return casesRegen;
        }

        private List<CaseGH> GetRegenSud(UpdateZoneRegenDto requestDto)
        {
            var xVille = requestDto.TownX;
            var yVille = requestDto.TownY;
            var totalX = requestDto.MapNbX;
            var totalY = requestDto.MapNbY;
            var casesRegen = new List<CaseGH>();
            var count = 0;

            for (var y = yVille + 1; y < totalY; y++)
            {
                count++;
                int offSet = count / 2;
                for (var x = xVille - offSet; x <= xVille + offSet; x++)
                {
                    if (x >= 0 && x <= totalX)
                    {
                        casesRegen.Add(new CaseGH(x, y));
                    }
                }
            }
            return casesRegen;
        }

        private List<CaseGH> GetRegenOuest(UpdateZoneRegenDto requestDto)
        {
            var xVille = requestDto.TownX;
            var yVille = requestDto.TownY;
            var totalX = requestDto.MapNbX;
            var totalY = requestDto.MapNbY;
            var casesRegen = new List<CaseGH>();
            var count = 0;

            for (var x = xVille - 1; x >= 0; x--)
            {
                count++;
                int offSet = count / 2;
                for (var y = yVille - offSet; y <= yVille + offSet; y++)
                {
                    if (x >= 0 && x <= totalX)
                    {
                        casesRegen.Add(new CaseGH(x, y));
                    }
                }
            }
            return casesRegen;
        }

        #endregion

        #endregion

        #region Bags

        private void UpdateBags(int townId, List<UpdateBagsContentsDto> bags)
        {
            if (bags != null)
            {
                using var scope = ServiceScopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
                using var transaction = dbContext.Database.BeginTransaction();
                var newLastUpdate = dbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(UserInfoProvider.GenerateLastUpdateInfo(), opt => opt.SetDbContext(dbContext))).Entity;
                dbContext.SaveChanges();

                foreach (var bag in bags)
                {
                    var citizen = dbContext.TownCitizens
                        .Include(x => x.IdBagNavigation)
                        .ThenInclude(bag => bag.BagItems)
                        .Single(x => x.IdTown == townId && x.IdUser == bag.UserId);
                    if (citizen.IdBagNavigation == null)
                    {
                        citizen.IdBagNavigation = new Bag()
                        {
                            IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo
                        };
                    }
                    dbContext.BagItems.RemoveRange(citizen.IdBagNavigation.BagItems);
                    citizen.IdBagNavigation.BagItems.Clear();
                    foreach (var item in bag.Objects)
                    {
                        citizen.IdBagNavigation.BagItems.Add(new BagItem()
                        {
                            Count = item.Count,
                            IdItem = item.Id,
                            IsBroken = item.IsBroken
                        });
                        citizen.IdBagNavigation.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
                    }
                }
                dbContext.SaveChanges();
                transaction.Commit();
            }
        }

        public LastUpdateInfoDto UpdateCitizenBag(int townId, int userId, List<UpdateObjectDto> bag)
        {
            using var scope = ServiceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
            townId = dbContext.ResolveTownId(townId);
            using var transaction = dbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = dbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(dbContext))).Entity;
            dbContext.SaveChanges();

            var citizen = dbContext.TownCitizens
                       .Include(x => x.IdBagNavigation)
                       .ThenInclude(bag => bag.BagItems)
                       .Single(x => x.IdTown == townId && x.IdUser == userId);
            if(citizen.IdBagNavigation is not null)
            {
                dbContext.BagItems.RemoveRange(citizen.IdBagNavigation.BagItems);
                citizen.IdBagNavigation.BagItems.Clear();
            } 
            else
            {
                var newBag = dbContext.Add(new Bag()).Entity;
                dbContext.SaveChanges();
                citizen.IdBagNavigation = newBag;
                citizen.IdBag = newBag.IdBag;
            }
            foreach (var item in bag)
            {
                var bagItem = dbContext.Add(new BagItem()
                {
                    Count = item.Count,
                    IdItem = item.Id,
                    IsBroken = item.IsBroken,
                    IdBag = citizen.IdBag.Value
                }).Entity;
                dbContext.SaveChanges();
                citizen.IdBagNavigation.BagItems.Add(bagItem);
                citizen.IdBagNavigation.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            }
            dbContext.SaveChanges();
            transaction.Commit();
            return lastUpdateInfoDto;
        }

        #endregion

        public LastUpdateInfoDto UpdateCitizenHome(int townId, int userId, CitizenHomeValueDto homeDetails)
        {
            using var scope = ServiceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
            townId = dbContext.ResolveTownId(townId);
            using var transaction = dbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = dbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(dbContext))).Entity;
            dbContext.SaveChanges();

            var citizen = dbContext.TownCitizens.Single(x => x.IdTown == townId && x.IdUser == userId);
            var citizenDetail = Mapper.Map<TownCitizen>(homeDetails);
            citizen.UpdateAllButKeysProperties(citizenDetail, ignoreNull: true);
            citizen.IdLastUpdateInfoHome = newLastUpdate.IdLastUpdateInfo;
            dbContext.SaveChanges();
            transaction.Commit();

            return lastUpdateInfoDto;
        }

        #region CitizenStatus

        public LastUpdateInfoDto UpdateCitizenStatus(int townId, int userId, List<string> status)
        {
            using var scope = ServiceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
            townId = dbContext.ResolveTownId(townId);
            using var transaction = dbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = dbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(dbContext))).Entity;
            dbContext.SaveChanges();

            var citizen = dbContext.TownCitizens.Single(x => x.IdTown == townId && x.IdUser == userId);
            var citizenDetail = GetTownCitizenStatusDetail(status);
            citizen.UpdateAllButKeysProperties(citizenDetail, ignoreNull: true);
            citizen.IdLastUpdateInfoStatus = newLastUpdate.IdLastUpdateInfo;
            dbContext.SaveChanges();
            transaction.Commit();
            return lastUpdateInfoDto;
        }

        private TownCitizen GetTownCitizenStatusDetail(List<string> statusValues)
        {
            var statusDetail = new TownCitizen()
            {
                IsAddict = false,
                IsArmWounded = false,
                IsCamper = false,
                IsCheatingDeathActive = false,
                IsCleanBody = false,
                IsConvalescent = false,
                IsDesy = false,
                IsDrugged = false,
                IsDrunk = false,
                IsEyeWounded = false,
                IsFootWounded = false,
                IsHandWounded = false,
                IsHungOver = false,
                IsHeadWounded = false,
                IsImmune = false,
                IsInfected = false,
                IsLegWounded = false,
                IsQuenched = false,
                IsSated = false,
                IsTerrorised = false,
                IsThirsty = false,
                IsTired = false,
            };
            foreach (var status in statusValues)
            {
                foreach (StatusValue statusValue in Enum.GetValues(typeof(StatusValue)))
                {
                    if (statusValue.GetDescription() == status)
                    {
                        switch (statusValue)
                        {
                            case StatusValue.Addict:
                                statusDetail.IsAddict = true;
                                break;
                            case StatusValue.ArmWounded:
                                statusDetail.IsArmWounded = true;
                                break;
                            case StatusValue.Camper:
                                statusDetail.IsCamper = true;
                                break;
                            case StatusValue.CheatingDeathActive:
                                statusDetail.IsCheatingDeathActive = true;
                                break;
                            case StatusValue.CleanBody:
                                statusDetail.IsCleanBody = true;
                                break;
                            case StatusValue.Convalescent:
                                statusDetail.IsConvalescent = true;
                                break;
                            case StatusValue.Desy:
                                statusDetail.IsDesy = true;
                                break;
                            case StatusValue.Drugged:
                                statusDetail.IsDrugged = true;
                                break;
                            case StatusValue.Drunk:
                                statusDetail.IsDrunk = true;
                                break;
                            case StatusValue.EyeWounded:
                                statusDetail.IsEyeWounded = true;
                                break;
                            case StatusValue.FootWounded:
                                statusDetail.IsFootWounded = true;
                                break;
                            case StatusValue.HandWounded:
                                statusDetail.IsHandWounded = true;
                                break;
                            case StatusValue.HangOver:
                                statusDetail.IsHungOver = true;
                                break;
                            case StatusValue.HeadWounded:
                                statusDetail.IsHeadWounded = true;
                                break;
                            case StatusValue.Immune:
                                statusDetail.IsImmune = true;
                                break;
                            case StatusValue.Infected:
                                statusDetail.IsInfected = true;
                                break;
                            case StatusValue.LegWounded:
                                statusDetail.IsLegWounded = true;
                                break;
                            case StatusValue.Quenched:
                                statusDetail.IsQuenched = true;
                                break;
                            case StatusValue.Sated:
                                statusDetail.IsSated = true;
                                break;
                            case StatusValue.Terrorised:
                                statusDetail.IsTerrorised = true;
                                break;
                            case StatusValue.Thirsty:
                                statusDetail.IsThirsty = true;
                                break;
                            case StatusValue.Tired:
                                statusDetail.IsTired = true;
                                break;
                        }
                    }
                }
            }
            return statusDetail;
        }

        public LastUpdateInfoDto UpdateGhoulStatus(int townId, int userId, UpdateGhoulStatusDto request)
        {
            using var scope = ServiceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
            townId = dbContext.ResolveTownId(townId);
            using var transaction = dbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = dbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(dbContext))).Entity;
            dbContext.SaveChanges();

            var citizen = dbContext.TownCitizens.Single(x => x.IdTown == townId && x.IdUser == userId);
            var citizenDetail = new TownCitizen();
            citizenDetail.IsGhoul = request.IsGhoul;
            citizenDetail.GhoulVoracity = request.Voracity;
            citizen.UpdateAllButKeysProperties(citizenDetail, ignoreNull: true);
            citizen.IdLastUpdateInfoGhoulStatus = newLastUpdate.IdLastUpdateInfo;
            dbContext.SaveChanges();
            transaction.Commit();
            return lastUpdateInfoDto;
        }
        #endregion

        #region CitizenHeroicAction

        public LastUpdateInfoDto UpdateCitizenHeroicActions(int townId, int userId, CitizenActionsHeroicValue actionHeroics)
        {
            using var scope = ServiceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
            townId = dbContext.ResolveTownId(townId);
            using var transaction = dbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = dbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(dbContext))).Entity;
            dbContext.SaveChanges();

            var citizen = dbContext.TownCitizens.Single(x => x.IdTown == townId && x.IdUser == userId);
            var citizenDetail = Mapper.Map<TownCitizen>(actionHeroics);
            citizen.UpdateAllButKeysProperties(citizenDetail, ignoreNull: true);
            citizen.IdLastUpdateInfoHeroicAction = newLastUpdate.IdLastUpdateInfo;
            dbContext.SaveChanges();
            transaction.Commit();

            return lastUpdateInfoDto;
        }

        private TownCitizen GetHeroicActionCitizenDetail(List<ActionHeroicDto> heroicActions)
        {
            var heroicActionDetail = new TownCitizen();
            foreach (var action in heroicActions)
            {
                if (action.Label == "Empty")
                {
                    if (action.Value == (int)ActionHeroicZone.Outside)
                    {
                        heroicActionDetail.HasLuckyFind = false;
                        heroicActionDetail.HasHeroicReturn = false;
                        heroicActionDetail.HasUppercut = false;
                        heroicActionDetail.HasSecondWind = false;
                        heroicActionDetail.HasCheatDeath = false;
                        heroicActionDetail.HasBrotherInArms = false;
                    }
                    if (action.Value == (int)ActionHeroicZone.Inside)
                    {
                        heroicActionDetail.HasLuckyFind = false;
                        heroicActionDetail.HasRescue = false;
                        heroicActionDetail.HasSecondWind = false;
                        heroicActionDetail.HasCheatDeath = false;
                        heroicActionDetail.HasBrotherInArms = false;
                    }
                    return heroicActionDetail;
                }
                else
                {
                    foreach (ActionHeroicType heroicType in Enum.GetValues(typeof(ActionHeroicType)))
                    {
                        if (heroicType.IsEquivalentToLabel(action.Locale, action.Label))
                        {
                            switch (heroicType)
                            {
                                case ActionHeroicType.Apag:
                                    heroicActionDetail.Apagcharges = action.Value;
                                    break;
                                case ActionHeroicType.CheatDeath:
                                    heroicActionDetail.HasCheatDeath = Convert.ToBoolean(action.Value);
                                    break;
                                case ActionHeroicType.HeroicReturn:
                                    heroicActionDetail.HasHeroicReturn = Convert.ToBoolean(action.Value);
                                    break;
                                case ActionHeroicType.LuckyFind:
                                    heroicActionDetail.HasLuckyFind = Convert.ToBoolean(action.Value);
                                    break;
                                case ActionHeroicType.Rescue:
                                    heroicActionDetail.HasRescue = Convert.ToBoolean(action.Value);
                                    break;
                                case ActionHeroicType.SecondWind:
                                    heroicActionDetail.HasSecondWind = Convert.ToBoolean(action.Value);
                                    break;
                                case ActionHeroicType.Uppercut:
                                    heroicActionDetail.HasUppercut = Convert.ToBoolean(action.Value);
                                    break;
                                case ActionHeroicType.BreakThrough:
                                    heroicActionDetail.HasBreakThrough = Convert.ToBoolean(action.Value);
                                    break;
                                case ActionHeroicType.BrotherInArms:
                                    heroicActionDetail.HasBrotherInArms = Convert.ToBoolean(action.Value);
                                    break;
                            }
                        }
                    }
                }
            }
            return heroicActionDetail;
        }

        #endregion
    }
}
