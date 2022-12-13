using AutoMapper;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models.Citizen;
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
        protected IBigBrothHordesRepository BigBrothHordesRepository { get; private set; }
        protected IFataMorganaRepository FataMorganaRepository { get; private set; }
        protected IGestHordesRepository GestHordesRepository { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected IUserInfoProvider UserInfoProvider { get; private set; }
        protected IMyHordesOptimizerRepository MyHordesOptimizerRepository { get; private set; }


        public ExternalToolsService(IBigBrothHordesRepository bigBrothHordesRepository,
            IFataMorganaRepository fataMorganaRepository,
            IGestHordesRepository gestHordesRepository,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            IMyHordesOptimizerRepository myHordesOptimizerRepository)
        {
            BigBrothHordesRepository = bigBrothHordesRepository;
            FataMorganaRepository = fataMorganaRepository;
            GestHordesRepository = gestHordesRepository;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            MyHordesOptimizerRepository = myHordesOptimizerRepository;
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
                        response.MapResponseDto.FataMorganaStatus = e.Message;
                    }
                });
                tasks.Add(fataTask);
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
                        response.MapResponseDto.GestHordesApiStatus = e.Message;
                    }
                }
                if (UpdateRequestMapToolsToUpdateDetailsDto.IsCell(gh))
                {
                    try
                    {
                        var cell = updateRequestDto.Map.Cell;
                        if (townDetails.IsDevaste || cell.DeadZombies > 0)
                        {
                            var request = Mapper.Map<GestHordesUpdateCaseRequest>(updateRequestDto);
                            var dictionnary = request.ToDictionnary();
                            var count = 0;
                            foreach (var item in cell.Objects)
                            {
                                dictionnary.Add($"dataObjet[{count}][idObjet]", item.Id);
                                dictionnary.Add($"dataObjet[{count}][nbr]", item.Count);
                                if (!item.IsBroken)
                                {
                                    dictionnary.Add($"dataObjet[{count}][type]", 1);
                                }
                                else
                                {
                                    dictionnary.Add($"dataObjet[{count}][type]", 2);
                                }
                                count++;
                            }
                            if (cell.DeadZombies > 0)
                            {
                                dictionnary.Add($"dataObjet[{count}][idObjet]", 5004);
                                dictionnary.Add($"dataObjet[{count}][nbr]", cell.DeadZombies);
                                dictionnary.Add($"dataObjet[{count}][type]", 4);
                            }
                            GestHordesRepository.UpdateCell(dictionnary);
                        }
                    }
                    catch (Exception e)
                    {
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
                        response.BagsResponseDto.MhoStatus = e.Message;
                    }
                });
                tasks.Add(mHOBagTask);
            }
            #endregion

            try
            {
                var patchHomeMho = false;
                var townCitizenDetail = new TownCitizenDetailModel(townDetails.TownId, UserInfoProvider.UserId);
                if (updateRequestDto.Amelios != null && updateRequestDto.Amelios.ToolsToUpdate.IsMyHordesOptimizer)
                {
                    var homeDetail = Mapper.Map<TownCitizenDetailModel>(updateRequestDto.Amelios.Values);
                    townCitizenDetail.ImportHomeDetail(homeDetail);
                    patchHomeMho = true;
                }
                var patchHeroicActionMho = false;
                if (updateRequestDto.HeroicActions != null && updateRequestDto.HeroicActions.ToolsToUpdate.IsMyHordesOptimizer)
                {
                    var heroicActionDetail = new TownCitizenDetailModel();
                    foreach (var action in updateRequestDto.HeroicActions.Actions)
                    {
                        foreach (ActionHeroicType heroicType in Enum.GetValues(typeof(ActionHeroicType)))
                        {
                            if (heroicType.IsEquivalentToLabel(action.Locale, action.Label))
                            {
                                switch (heroicType)
                                {
                                    case ActionHeroicType.Apag:
                                        heroicActionDetail.ApagCharges = action.Value;
                                        break;
                                    case ActionHeroicType.CheatDeath:
                                        heroicActionDetail.IsCheatingDeathActive = Convert.ToBoolean(action.Value);
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
                                }
                            }
                        }
                    }
                    townCitizenDetail.ImportHeroicActionDetail(heroicActionDetail);
                    patchHeroicActionMho = true;
                }
                var patchStatusMho = false;
                if (updateRequestDto.Status != null && updateRequestDto.Status.ToolsToUpdate.IsMyHordesOptimizer)
                {

                    var statusDetail = new TownCitizenDetailModel();
                    foreach (var status in updateRequestDto.Status.Values)
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
                                    case StatusValue.Ghoul:
                                        statusDetail.IsGhoul = true;
                                        break;
                                    case StatusValue.HandWounded:
                                        statusDetail.IsHandWounded = true;
                                        break;
                                    case StatusValue.HangOver:
                                        statusDetail.IsHangOver = true;
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
                    townCitizenDetail.ImportStatusDetail(statusDetail);
                    patchStatusMho = true;
                }

                if (patchHomeMho || patchStatusMho || patchHeroicActionMho)
                {
                    var mHOCitizenDetailTask = Task.Run(() =>
                    {
                        try
                        {
                            var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
                            if(patchHomeMho)
                            {
                                var homeLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
                                townCitizenDetail.idLastUpdateInfoHome = homeLastUpdateInfo;
                            }
                            if(patchStatusMho)
                            {
                                var statusLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
                                townCitizenDetail.idLastUpdateInfoStatus = statusLastUpdateInfo;
                            }
                            if (patchHeroicActionMho)
                            {
                                var heroicActionLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
                                townCitizenDetail.idLastUpdateInfoHeroicAction = heroicActionLastUpdateInfo;
                            }
                            MyHordesOptimizerRepository.PatchCitizenDetail(townId: townDetails.TownId, citizenDetail: townCitizenDetail);
                        }
                        catch (Exception e)
                        {
                            response.HeroicActionsResponseDto.MhoStatus = e.Message;
                            response.StatusResponseDto.MhoStatus = e.Message;
                            response.HomeResponseDto.MhoStatus = e.Message;
                        }
                    });
                    tasks.Add(mHOCitizenDetailTask);
                }
            }
            catch (Exception e)
            {
                response.HeroicActionsResponseDto.MhoStatus = e.Message;
                response.HeroicActionsResponseDto.GestHordesStatus = e.Message;
                response.StatusResponseDto.MhoStatus = e.Message;
                response.HomeResponseDto.MhoStatus = e.Message;
                response.HomeResponseDto.GestHordesStatus = e.Message;
            }

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
                var bagsId = MyHordesOptimizerRepository.GetCitizenBagsId(townId, bags.Select(x => x.UserId));
                var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
                var citizens = new List<Citizen>();
                foreach (var bag in bags)
                {
                    var citizen = new Citizen();
                    citizen.Bag.IdBag = bagsId[bag.UserId];

                    foreach (var item in bag.Objects)
                    {
                        var citizenItem = new CitizenItem()
                        {
                            Count = item.Count,
                            IsBroken = item.IsBroken
                        };
                        citizenItem.Item.Id = item.Id;
                        citizen.Bag.Items.Add(citizenItem);
                    }
                    citizens.Add(citizen);
                }
                MyHordesOptimizerRepository.PatchCitizenBags(townId, lastUpdateInfo, citizens);
            }
        }

        public LastUpdateInfo UpdateBag(int townId, int userId, List<UpdateObjectDto> bag)
        {
            var bagId = MyHordesOptimizerRepository.GetCitizenBagId(townId, userId);
            var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            var citizen = new Citizen();
            var citizens = new List<Citizen>()
            {
                citizen
            };
            citizen.Bag.IdBag = bagId;
            foreach (var item in bag)
            {
                var citizenItem = new CitizenItem()
                {
                    Count = item.Count,
                    IsBroken = item.IsBroken
                };
                citizenItem.Item.Id = item.Id;
                citizen.Bag.Items.Add(citizenItem);
            }
            MyHordesOptimizerRepository.PatchCitizenBags(townId, lastUpdateInfo, citizens);
            return lastUpdateInfo;
        }

        #endregion
    }
}
