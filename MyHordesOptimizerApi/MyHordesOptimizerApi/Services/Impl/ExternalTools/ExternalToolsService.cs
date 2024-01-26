using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.MajCase;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Bag;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
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
            if (UpdateRequestMapToolsToUpdateDetailsDto.IsApi(bbh))
            {
                var bbhTask = Task.Run(() =>
                {
                    try
                    {
                        BigBrothHordesRepository.Update();
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"{e.ToString()} => {updateRequestDto.ToJson()}");
                        response.MapResponseDto.BigBrothHordesStatus = e.Message;
                    }
                });
                tasks.Add(bbhTask);
            }
            if (UpdateRequestMapToolsToUpdateDetailsDto.IsApi(fata))
            {
                var fataTask = Task.Run(() =>
                {

                    try
                    {
                        FataMorganaRepository.Update();
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"{e.ToString()} => {updateRequestDto.ToJson()}");
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
                        var me = MyHordesApiRepository.GetMe();
                        var zones = me.Map.Zones;
                        var listCells = new List<MapCell>();
                        var listCellItems = new List<MapCellItem>();
                        var driedCell = new List<MapCell>();

                        var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
                        //var idLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);

                        var townId = me.Map.Id;
                        var zoneItemX = -1;
                        var zoneItemY = -1;
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
                            var cell = new MapCell()
                            {
                                IdTown = townId,
                                //IdLastUpdateInfo = idLastUpdateInfo,
                                X = zone.X,
                                Y = zone.Y,
                                IsTown = Convert.ToUInt64(zone.X == me.Map.City.X && zone.Y == me.Map.City.Y),
                                IsVisitedToday = Convert.ToUInt64(!Convert.ToBoolean(zone.Nvt)),
                                IsNeverVisited = Convert.ToUInt64(false),
                                DangerLevel = zone.Danger,
                                IsDryed = Convert.ToUInt64(isDried),
                                IdRuin = type,
                                NbZombie = nbZombie,
                                NbZombieKilled = null,
                                NbHero = nbHero,
                                IsRuinCamped = Convert.ToUInt64(zone.Building?.Camped),
                                IsRuinDryed = Convert.ToUInt64(zone.Building?.Dried),
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
                                        IsBroken = Convert.ToUInt64(item.Broken)
                                    };
                                    listCellItems.Add(cellItem);
                                }
                            }
                            listCells.Add(cell);
                        }
                        if (UpdateRequestMapToolsToUpdateDetailsDto.IsCell(mho) && updateRequestDto.Map.Cell != null)
                        {
                            UpdateCellInfoDto updateCellDto = updateRequestDto.Map.Cell;
                            var realX = updateRequestDto.TownDetails.TownX + updateCellDto.X;
                            var realY = updateRequestDto.TownDetails.TownY - updateCellDto.Y;

                            var cellToUpdate = listCells.Single(cell => cell.X == realX && cell.Y == realY);

                            cellToUpdate.NbZombie = updateCellDto.Zombies;
                            cellToUpdate.NbZombieKilled = updateCellDto.DeadZombies;
                            cellToUpdate.IsDryed = Convert.ToUInt64(updateCellDto.ZoneEmpty);

                            listCellItems.Clear();
                            var items = Mapper.Map<List<MapCellItem>>(updateCellDto.Objects);
                            items.ForEach(item => item.IdCell = cellToUpdate.IdCell);
                            listCellItems.AddRange(items);

                            if (updateCellDto.CitizenId.Any())
                            {
                                //MyHordesOptimizerRepository.UpdateCitizenLocation(updateRequestDto.TownDetails.TownId, realX, realY, updateCellDto.CitizenId, idLastUpdateInfo);
                            }
                        }
                        //MyHordesOptimizerRepository.PatchMapCell(townId, listCells, forceUpdate: false);
                        //MyHordesOptimizerRepository.ClearCellDig(listCells.Where(cell => Convert.ToBoolean(cell.IsDryed)).Select(cell => cell.IdCell));
                        if (zoneItemX != -1 && zoneItemY != -1)
                        {
                            //var cellWithItemId = MyHordesOptimizerRepository.GetCell(townId, x: zoneItemX, y: zoneItemY);
                            //listCellItems.ForEach(cellItem => cellItem.IdCell = cellWithItemId.IdCell);
                            //MyHordesOptimizerRepository.ClearCellItem(cellWithItemId.IdCell, idLastUpdateInfo);
                            //MyHordesOptimizerRepository.PatchMapCellItem(townId, listCellItems);
                        }
                    }
                    catch (Exception e)
                    {
                        Logger.LogWarning($"{e.ToString()} => {updateRequestDto.ToJson()}");
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
                    catch (Exception e)
                    {
                        Logger.LogWarning($"{e.ToString()} => {updateRequestDto.ToJson()}");
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
                    catch (Exception e)
                    {
                        Logger.LogWarning($"{e.ToString()} => {updateRequestDto.ToJson()}");
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
                        Logger.LogWarning($"{e.ToString()} => {updateRequestDto.ToJson()}");
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
                            var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
                            if (patchHomeMho)
                            {
                                //var homeLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
                                //townCitizenDetail.IdLastUpdateInfoHome = homeLastUpdateInfo;
                            }
                            if (patchStatusMho)
                            {
                                //var statusLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
                                //townCitizenDetail.IdLastUpdateInfoStatus = statusLastUpdateInfo;
                            }
                            if (patchHeroicActionMho)
                            {
                                //var heroicActionLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
                                //townCitizenDetail.IdLastUpdateInfoHeroicAction = heroicActionLastUpdateInfo;
                            }
                            //MyHordesOptimizerRepository.PatchCitizenDetail(citizenDetail: townCitizenDetail);
                        }
                        catch (Exception e)
                        {
                            Logger.LogWarning($"{e.ToString()} => {updateRequestDto.ToJson()}");
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
                            Logger.LogWarning($"{e.ToString()} => {updateRequestDto.ToJson()}");
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
                Logger.LogWarning($"{e.ToString()} => {updateRequestDto.ToJson()}");
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
                var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
                //var idLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);

                var cellDigsToUpdate = new List<MapCellDig>();
                var realX = updateRequestDto.TownDetails.TownX + successedDig.Cell.X;
                var realY = updateRequestDto.TownDetails.TownY - successedDig.Cell.Y;
                int townId = updateRequestDto.TownDetails.TownId;
                //var cell = MyHordesOptimizerRepository.GetCell(townId, x: realX, y: realY);
                foreach (var dig in successedDig.Values)
                {
                    cellDigsToUpdate.Add(new MapCellDig()
                    {
                        Day = successedDig.Cell.Day,
                        //IdCell = cell.IdCell,
                        IdUser = dig.CitizenId,
                        NbSucces = dig.SuccessDigs,
                        NbTotalDig = dig.TotalDigs,
                        //IdLastUpdateInfo = idLastUpdateInfo
                    });
                }
                //MyHordesOptimizerRepository.PatchCellDig(townId, cellDigsToUpdate);
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
                //var bagsId = MyHordesOptimizerRepository.GetCitizenBagsId(townId, bags.Select(x => x.UserId));
                var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
                var citizens = new List<CitizenDto>();
                foreach (var bag in bags)
                {
                    var citizen = new CitizenDto();
                    //citizen.Bag.IdBag = bagsId[bag.UserId];

                    foreach (var item in bag.Objects)
                    {
                        var citizenItem = new BagItemDto()
                        {
                            Count = item.Count,
                            IsBroken = item.IsBroken
                        };
                        citizenItem.Item.Id = item.Id;
                        citizen.Bag.Items.Add(citizenItem);
                    }
                    citizens.Add(citizen);
                }
                //MyHordesOptimizerRepository.PatchCitizenBags(townId, lastUpdateInfo, citizens);
            }
        }

        public LastUpdateInfo UpdateCitizenBag(int townId, int userId, List<UpdateObjectDto> bag)
        {
            //var bagId = MyHordesOptimizerRepository.GetCitizenBagId(townId, userId);
            var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            var citizen = new CitizenDto();
            var citizens = new List<CitizenDto>()
            {
                citizen
            };
            //citizen.Bag.IdBag = bagId;
            foreach (var item in bag)
            {
                var citizenItem = new BagItemDto()
                {
                    Count = item.Count,
                    IsBroken = item.IsBroken
                };
                citizenItem.Item.Id = item.Id;
                citizen.Bag.Items.Add(citizenItem);
            }
            //MyHordesOptimizerRepository.PatchCitizenBags(townId, lastUpdateInfo, citizens);
            return lastUpdateInfo;
        }

        #endregion

        public LastUpdateInfo UpdateCitizenHome(int townId, int userId, CitizenHomeValueDto homeDetails)
        {
            var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            //var homeLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
            var citizenDetail = Mapper.Map<TownCitizen>(homeDetails);
            citizenDetail.IdUser = userId;
            citizenDetail.IdTown = townId;
            //citizenDetail.IdLastUpdateInfoHome = homeLastUpdateInfo;
            //MyHordesOptimizerRepository.PatchCitizenDetail(citizenDetail: citizenDetail);
            return lastUpdateInfo;
        }

        #region CitizenStatus

        public LastUpdateInfo UpdateCitizenStatus(int townId, int userId, List<string> status)
        {
            var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            //var statusLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
            var citizenDetail = GetTownCitizenStatusDetail(status);
            citizenDetail.IdUser = userId;
            citizenDetail.IdTown = townId;
            //citizenDetail.IdLastUpdateInfoStatus = statusLastUpdateInfo;
            //MyHordesOptimizerRepository.PatchCitizenDetail(citizenDetail: citizenDetail);
            return lastUpdateInfo;
        }

        private TownCitizen GetTownCitizenStatusDetail(List<string> statusValues)
        {
            var statusDetail = new TownCitizen()
            {
                IsAddict = Convert.ToUInt64(false),
                IsArmWounded = Convert.ToUInt64(false),
                IsCamper = Convert.ToUInt64(false),
                IsCheatingDeathActive = Convert.ToUInt64(false),
                IsCleanBody = Convert.ToUInt64(false),
                IsConvalescent = Convert.ToUInt64(false),
                IsDesy = Convert.ToUInt64(false),
                IsDrugged = Convert.ToUInt64(false),
                IsDrunk = Convert.ToUInt64(false),
                IsEyeWounded = Convert.ToUInt64(false),
                IsFootWounded = Convert.ToUInt64(false),
                IsHandWounded = Convert.ToUInt64(false),
                IsHungOver = Convert.ToUInt64(false),
                IsHeadWounded = Convert.ToUInt64(false),
                IsImmune = Convert.ToUInt64(false),
                IsInfected = Convert.ToUInt64(false),
                IsLegWounded = Convert.ToUInt64(false),
                IsQuenched = Convert.ToUInt64(false),
                IsSated = Convert.ToUInt64(false),
                IsTerrorised = Convert.ToUInt64(false),
                IsThirsty = Convert.ToUInt64(false),
                IsTired = Convert.ToUInt64(false),
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
                                statusDetail.IsAddict = Convert.ToUInt64(true);
                                break;
                            case StatusValue.ArmWounded:
                                statusDetail.IsArmWounded = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Camper:
                                statusDetail.IsCamper = Convert.ToUInt64(true);
                                break;
                            case StatusValue.CheatingDeathActive:
                                statusDetail.IsCheatingDeathActive = Convert.ToUInt64(true);
                                break;
                            case StatusValue.CleanBody:
                                statusDetail.IsCleanBody = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Convalescent:
                                statusDetail.IsConvalescent = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Desy:
                                statusDetail.IsDesy = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Drugged:
                                statusDetail.IsDrugged = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Drunk:
                                statusDetail.IsDrunk = Convert.ToUInt64(true);
                                break;
                            case StatusValue.EyeWounded:
                                statusDetail.IsEyeWounded = Convert.ToUInt64(true);
                                break;
                            case StatusValue.FootWounded:
                                statusDetail.IsFootWounded = Convert.ToUInt64(true);
                                break;
                            case StatusValue.HandWounded:
                                statusDetail.IsHandWounded = Convert.ToUInt64(true);
                                break;
                            case StatusValue.HangOver:
                                statusDetail.IsHungOver = Convert.ToUInt64(true);
                                break;
                            case StatusValue.HeadWounded:
                                statusDetail.IsHeadWounded = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Immune:
                                statusDetail.IsImmune = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Infected:
                                statusDetail.IsInfected = Convert.ToUInt64(true);
                                break;
                            case StatusValue.LegWounded:
                                statusDetail.IsLegWounded = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Quenched:
                                statusDetail.IsQuenched = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Sated:
                                statusDetail.IsSated = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Terrorised:
                                statusDetail.IsTerrorised = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Thirsty:
                                statusDetail.IsThirsty = Convert.ToUInt64(true);
                                break;
                            case StatusValue.Tired:
                                statusDetail.IsTired = Convert.ToUInt64(true);
                                break;
                        }
                    }
                }
            }
            return statusDetail;
        }

        public LastUpdateInfo UpdateGhoulStatus(int townId, int userId, UpdateGhoulStatusDto request)
        {
            var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            //var ghoulStatusLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
            var citizenDetail = new TownCitizen();
            citizenDetail.IdUser = userId;
            citizenDetail.IdTown = townId;
            //citizenDetail.IdLastUpdateInfoGhoulStatus = ghoulStatusLastUpdateInfo;
            citizenDetail.IsGhoul = Convert.ToUInt64(request.IsGhoul);
            citizenDetail.GhoulVoracity = request.Voracity;
            //MyHordesOptimizerRepository.PatchCitizenDetail(citizenDetail: citizenDetail);
            return lastUpdateInfo;
        }
        #endregion

        #region CitizenHeroicAction

        public LastUpdateInfo UpdateCitizenHeroicActions(int townId, int userId, CitizenActionsHeroicValue actionHeroics)
        {
            var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            //var heroicActionLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
            var citizenDetail = Mapper.Map<TownCitizen>(actionHeroics);
            citizenDetail.IdUser = userId;
            citizenDetail.IdTown = townId;
            //citizenDetail.IdLastUpdateInfoHeroicAction = heroicActionLastUpdateInfo;
            //MyHordesOptimizerRepository.PatchCitizenDetail(citizenDetail: citizenDetail);
            return lastUpdateInfo;
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
                        heroicActionDetail.HasLuckyFind = Convert.ToUInt64(false);
                        heroicActionDetail.HasHeroicReturn = Convert.ToUInt64(false);
                        heroicActionDetail.HasUppercut = Convert.ToUInt64(false);
                        heroicActionDetail.HasSecondWind = Convert.ToUInt64(false);
                        heroicActionDetail.HasCheatDeath = Convert.ToUInt64(false);
                        heroicActionDetail.HasBrotherInArms = Convert.ToUInt64(false);
                    }
                    if (action.Value == (int)ActionHeroicZone.Inside)
                    {
                        heroicActionDetail.HasLuckyFind = Convert.ToUInt64(false);
                        heroicActionDetail.HasRescue = Convert.ToUInt64(false);
                        heroicActionDetail.HasSecondWind = Convert.ToUInt64(false);
                        heroicActionDetail.HasCheatDeath = Convert.ToUInt64(false);
                        heroicActionDetail.HasBrotherInArms = Convert.ToUInt64(false);
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
                                    heroicActionDetail.HasCheatDeath = Convert.ToUInt64(action.Value);
                                    break;
                                case ActionHeroicType.HeroicReturn:
                                    heroicActionDetail.HasHeroicReturn = Convert.ToUInt64(action.Value);
                                    break;
                                case ActionHeroicType.LuckyFind:
                                    heroicActionDetail.HasLuckyFind = Convert.ToUInt64(action.Value);
                                    break;
                                case ActionHeroicType.Rescue:
                                    heroicActionDetail.HasRescue = Convert.ToUInt64(action.Value);
                                    break;
                                case ActionHeroicType.SecondWind:
                                    heroicActionDetail.HasSecondWind = Convert.ToUInt64(action.Value);
                                    break;
                                case ActionHeroicType.Uppercut:
                                    heroicActionDetail.HasUppercut = Convert.ToUInt64(action.Value);
                                    break;
                                case ActionHeroicType.BreakThrough:
                                    heroicActionDetail.HasBreakThrough = Convert.ToUInt64(action.Value);
                                    break;
                                case ActionHeroicType.BrotherInArms:
                                    heroicActionDetail.HasBrotherInArms = Convert.ToUInt64(action.Value);
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
