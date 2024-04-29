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
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Extensions.Models;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
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


        public ExternalToolsService(ILogger<ExternalToolsService> logger,
            IBigBrothHordesRepository bigBrothHordesRepository,
            IFataMorganaRepository fataMorganaRepository,
            IGestHordesRepository gestHordesRepository,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            IServiceScopeFactory serviceScopeFactory,
            IMyHordesApiRepository myHordesApiRepository)
        {
            Logger = logger;
            BigBrothHordesRepository = bigBrothHordesRepository;
            FataMorganaRepository = fataMorganaRepository;
            GestHordesRepository = gestHordesRepository;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            ServiceScopeFactory = serviceScopeFactory;
            MyHordesApiRepository = myHordesApiRepository;
        }

        public async Task<UpdateResponseDto> UpdateExternalsTools(UpdateRequestDto updateRequestDto)
        {
            var response = new UpdateResponseDto(updateRequestDto);
            var townDetails = updateRequestDto.TownDetails;
            var tasks = new List<Task>();

            #region Maps
            var bbh = updateRequestDto.Map.ToolsToUpdate.IsBigBrothHordes;
            var gh = updateRequestDto.Map.ToolsToUpdate.IsGestHordes;
            var fata = updateRequestDto.Map.ToolsToUpdate.IsFataMorgana;
            var mho = updateRequestDto.Map.ToolsToUpdate.IsMyHordesOptimizer;
            LastUpdateInfo newLastUpdate = null;
            if (UpdateRequestMapToolsToUpdateDetailsDto.IsApi(mho)
                || UpdateRequestMapToolsToUpdateDetailsDto.IsCell(mho)
                || updateRequestDto.SuccessedDig != null
                || updateRequestDto.Amelios?.ToolsToUpdate.IsMyHordesOptimizer == true)
            {
                using var scope = ServiceScopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
                newLastUpdate = dbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(UserInfoProvider.GenerateLastUpdateInfo(), opt => opt.SetDbContext(dbContext))).Entity;
                dbContext.SaveChanges();
            }

            if (UpdateRequestMapToolsToUpdateDetailsDto.IsApi(bbh))
            {
                var bbhTask = Task.Run(() =>
                {
                    try
                    {
                        BigBrothHordesRepository.Update();
                    }
                    catch (WebApiException e)
                    {
                        Logger.LogWarning($"Exception pendant la maj globale BBH : {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.BigBrothHordesStatus = $"{e.Message} : {e.Response}";
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la maj globale BBH : {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.BigBrothHordesStatus = e.Message;
                    }
                });
                tasks.Add(bbhTask);
            }
            if (UpdateRequestMapToolsToUpdateDetailsDto.IsApi(fata) || UpdateRequestMapToolsToUpdateDetailsDto.IsCell(fata))
            {
                var fataTask = Task.Run(async () =>
                {
                    try
                    {
                        var isCell = UpdateRequestMapToolsToUpdateDetailsDto.IsCell(fata);
                        if(isCell)
                        {
                            var cell = updateRequestDto.Map?.Cell;
                            await FataMorganaRepository.UpdateAsync(chaosX: cell.X, chaosY: cell.Y, deadZombie: cell.DeadZombies);
                        }
                        else
                        {
                            await FataMorganaRepository.UpdateAsync();
                        }
                    }
                    catch (WebApiException e)
                    {
                        Logger.LogWarning($"Exception pendant la maj globale Fata : {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.FataMorganaStatus = $"{e.Message} : {e.Response}";
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la maj globale Fata : {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.FataMorganaStatus = e.Message;
                    }
                });
                tasks.Add(fataTask);
            }
            if (UpdateRequestMapToolsToUpdateDetailsDto.IsApi(mho) || UpdateRequestMapToolsToUpdateDetailsDto.IsCell(mho))
            {
                var mhoTask = Task.Run(() =>
                {
                    try
                    {
                        using var scope = ServiceScopeFactory.CreateScope();
                        var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
                        using var transaction = dbContext.Database.BeginTransaction();

                        var me = MyHordesApiRepository.GetMe();
                        var zones = me.Map.Zones;
                        var listCells = new List<MapCell>();
                        var listCellItems = new List<MapCellItem>();
                        var driedCell = new List<MapCell>();

                        var townId = me.Map.Id;
                        var zoneItemX = -1;
                        var zoneItemY = -1;
                        var allCell = dbContext.MapCells.Where(cell => cell.IdTown == updateRequestDto.TownDetails.TownId)
                                                        .ToList();
                        foreach (var zone in zones)
                        {
                            int? nbHero = null;
                            int? nbZombie = null;
                            bool? isDried = null;

                            var details = zone.Details;
                            if (details.GetType() != typeof(JArray))
                            {
                                var jObject = details as JObject;
                                var detail = jObject.ToObject<MyHordesDetails>();
                                nbHero = detail.H;
                                nbZombie = detail.Z;
                                isDried = detail.Dried;
                            }

                            int? averagePotentialRemainingDig = null;
                            int? maxPotentialRemainingDig = null;
                            if (isDried.HasValue && isDried.Value)
                            {
                                averagePotentialRemainingDig = 0;
                                maxPotentialRemainingDig = 0;
                            }
                            int? type = zone.Building?.Type;
                            var cellModel = allCell.FirstOrDefault(cell => cell.X == zone.X
                                                                  && cell.Y == zone.Y);
                            var cell = new MapCell()
                            {
                                IdTown = townId,
                                IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo,
                                X = zone.X,
                                Y = zone.Y,
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
                                MaxPotentialRemainingDig = maxPotentialRemainingDig
                            };
                            if (zone.Items != null)
                            {
                                zoneItemX = zone.X;
                                zoneItemY = zone.Y;
                                foreach (var item in zone.Items)
                                {
                                    var cellItem = new MapCellItem()
                                    {
                                        Count = item.Count,
                                        IdItem = item.Id,
                                        IsBroken = item.Broken,
                                        IdCell = cellModel.IdCell
                                    };
                                    listCellItems.Add(cellItem);
                                }
                            }
                            cellModel.UpdateAllButKeysProperties(cell, ignoreNull: true);
                            listCells.Add(cellModel);
                        }
                        if (UpdateRequestMapToolsToUpdateDetailsDto.IsCell(mho) && updateRequestDto.Map.Cell != null)
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

                            if (updateCellDto.CitizenId.Any())
                            {
                                var citizenModels = dbContext.TownCitizens.Where(citizen => citizen.IdTown == updateRequestDto.TownDetails.TownId
                                                                                 && updateCellDto.CitizenId.Contains(citizen.IdUser))
                                                                         .ToList();
                                dbContext.RemoveRange(citizenModels);
                                var newCitizenModels = citizenModels.Select(citizen =>
                                {
                                    var newCitizen = citizen.ToJson().FromJson<TownCitizen>();
                                    newCitizen.PositionX = realX;
                                    newCitizen.PositionY = realY;
                                    newCitizen.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
                                    var entity = dbContext.Add(newCitizen).Entity;
                                    return entity;
                                }).ToList();
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
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la maj map MHO {e.ToString()} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.MhoApiStatus = e.Message;
                    }
                });
                tasks.Add(mhoTask);
            }
            var ghTask = Task.Run(() =>
            {
                if (UpdateRequestMapToolsToUpdateDetailsDto.IsApi(gh) || UpdateRequestMapToolsToUpdateDetailsDto.IsCell(gh))
                {
                    try
                    {
                        GestHordesRepository.Update();
                    }
                    catch (WebApiException e)
                    {
                        Logger.LogWarning($"Exception pendant la maj api GH :  {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.GestHordesApiStatus = $"{e.Message} : {e.Response}";
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la maj api GH :  {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.GestHordesApiStatus = e.Message;
                    }
                }
                if (UpdateRequestMapToolsToUpdateDetailsDto.IsCell(gh))
                {
                    try
                    {
                        var cell = updateRequestDto.Map.Cell;
                        var realX = updateRequestDto.TownDetails.TownX + cell.X;
                        var realY = updateRequestDto.TownDetails.TownY - cell.Y;
                        if (townDetails.IsDevaste || cell.DeadZombies > 0)
                        {

                            if (cell.Objects != null && townDetails.IsDevaste)
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
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la maj cell GH : {e} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.GestHordesCellsStatus = e.Message;
                    }
                }
            });
            tasks.Add(ghTask);
            #endregion

            #region Bag
            if (updateRequestDto.Bags != null && updateRequestDto.Bags.ToolsToUpdate.IsMyHordesOptimizer)
            {
                var mHOBagTask = Task.Run(() =>
                {
                    try
                    {
                        UpdateBags(townDetails.TownId, updateRequestDto.Bags.Contents);

                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"Exception pendant la MAJ des sacs de MHO : {e.ToString()} => {updateRequestDto.ToJson()}");
                        response.BagsResponseDto.MhoStatus = e.Message;
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
                    IdTown = townDetails.TownId,
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

                if (patchHomeMho || patchStatusMho || patchHeroicActionMho)
                {
                    var mHOCitizenDetailTask = Task.Run(() =>
                    {
                        try
                        {
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
                        }
                        catch (Exception e)
                        {
                            Logger.LogWarning($"Exception pendant la MAJ du détail d'un citizen MHO : {e.ToString()} => {updateRequestDto.ToJson()}");
                            response.HeroicActionsResponseDto.MhoStatus = e.Message;
                            response.StatusResponseDto.MhoStatus = e.Message;
                            response.HomeResponseDto.MhoStatus = e.Message;
                        }
                    });
                    tasks.Add(mHOCitizenDetailTask);
                }

                if (patchHomeGh || patchStatusGh || patchHeroicActionGh)
                {
                    var gHCitizenDetailTask = Task.Run(() =>
                    {
                        try
                        {
                            GestHordesRepository.UpdateCitizen(ghUpdateCitizenRequest);
                        }
                        catch (Exception e)
                        {
                            Logger.LogWarning($"Exception pendant la MAJ du détail d'un citizen GH : {e.ToString()} => {updateRequestDto.ToJson()}");
                            response.HeroicActionsResponseDto.GestHordesStatus = e.Message;
                            response.StatusResponseDto.GestHordesStatus = e.Message;
                            response.HomeResponseDto.GestHordesStatus = e.Message;
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
            }

            #endregion

            #region SuccesDig

            var successedDig = updateRequestDto.SuccessedDig;
            if (successedDig != null)
            {
                try
                {
                    using var scope = ServiceScopeFactory.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
                    using var transaction = dbContext.Database.BeginTransaction();

                    var cellDigsToUpdate = new List<MapCellDig>();
                    var realX = updateRequestDto.TownDetails.TownX + successedDig.Cell.X;
                    var realY = updateRequestDto.TownDetails.TownY - successedDig.Cell.Y;
                    int townId = updateRequestDto.TownDetails.TownId;

                    var cellId = dbContext.MapCells.Where(cell => cell.IdTown == updateRequestDto.TownDetails.TownId
                                                                     && cell.X == realX
                                                                     && cell.Y == realY)
                                                                .Select(cell => cell.IdCell)
                                                                .Single();
                    foreach (var dig in successedDig.Values)
                    {
                        var cellDigModel = dbContext.MapCellDigs.Where(cellDig => cellDig.IdCellNavigation.IdTown == updateRequestDto.TownDetails.TownId
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
                }
                catch (Exception e)
                {
                    Logger.LogWarning($"Exception pendant la MAJ des digs de MHO : {e.ToString()} => {updateRequestDto.ToJson()}");
                    response.DigResponseDto.MhoStatus = e.Message;
                }
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
