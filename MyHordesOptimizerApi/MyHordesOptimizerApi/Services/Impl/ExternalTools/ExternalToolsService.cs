using AutoMapper;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Extensions;
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

            var bbh = updateRequestDto.Tools.IsBigBrothHordes;
            var gh = updateRequestDto.Tools.IsGestHordes;
            var fata = updateRequestDto.Tools.IsFataMorgana;
            var townDetails = updateRequestDto.TownDetails;
            var tasks = new List<Task>();
            if (UpdateRequestToolsDetailsDto.IsApi(bbh))
            {
                var bbhTask = Task.Run(() =>
                {
                    try
                    {
                        BigBrothHordesRepository.Update();
                    }
                    catch (Exception e)
                    {
                        response.BigBrothHordesStatus = e.Message;
                    }
                });
                tasks.Add(bbhTask);
            }

            if (UpdateRequestToolsDetailsDto.IsApi(fata))
            {
                var fataTask = Task.Run(() =>
                {

                    try
                    {
                        FataMorganaRepository.Update();
                    }
                    catch (Exception e)
                    {
                        response.FataMorganaStatus = e.Message;
                    }
                });
                tasks.Add(fataTask);
            }

            var ghTask = Task.Run(() =>
            {
                if (UpdateRequestToolsDetailsDto.IsApi(gh) || UpdateRequestToolsDetailsDto.IsCell(gh))
                {
                    try
                    {
                        GestHordesRepository.Update();
                    }
                    catch (Exception e)
                    {
                        response.GestHordesStatus = e.Message;
                    }
                }
                if (UpdateRequestToolsDetailsDto.IsCell(gh))
                {
                    try
                    {
                        var cell = updateRequestDto.Cell;
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
                        response.GestHordesStatus = e.Message;
                    }
                }
            });
            tasks.Add(ghTask);

            var bagTask = Task.Run(() =>
            {
                try
                {
                    UpdateBags(townDetails.TownId, updateRequestDto.Bags);

                }
                catch (Exception e)
                {
                    response.MhoStatus = e.Message;
                }            });
            tasks.Add(bagTask);
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

        private void UpdateBags(int townId, List<UpdateBagDto> bags)
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
