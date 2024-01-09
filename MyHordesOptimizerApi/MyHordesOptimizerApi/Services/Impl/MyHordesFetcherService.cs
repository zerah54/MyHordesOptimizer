using AutoMapper;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Extensions.Models;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Map;
using MyHordesOptimizerApi.Models.Views.Citizens;
using MyHordesOptimizerApi.Models.Views.Items;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class MyHordesFetcherService : IMyHordesFetcherService
    {
        protected ILogger<MyHordesFetcherService> Logger { get; set; }
        protected IMyHordesApiRepository MyHordesJsonApiRepository { get; set; }
        protected IMyHordesOptimizerRepository MyHordesOptimizerRepository { get; set; }
        protected IMyHordesCodeRepository MyHordesCodeRepository { get; set; }
        protected IMyHordesScrutateurConfiguration MyHordesScrutateurConfiguration { get; set; }
        protected readonly IMapper Mapper;
        protected IUserInfoProvider UserInfoProvider { get; set; }


        public MyHordesFetcherService(ILogger<MyHordesFetcherService> logger,
            IMyHordesApiRepository myHordesJsonApiRepository,
            IMyHordesOptimizerRepository firebaseRepository,
            IMyHordesCodeRepository myHordesCodeRepository,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            IMyHordesScrutateurConfiguration myHordesScrutateurConfiguration)
        {
            Logger = logger;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            MyHordesOptimizerRepository = firebaseRepository;
            MyHordesCodeRepository = myHordesCodeRepository;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            MyHordesScrutateurConfiguration = myHordesScrutateurConfiguration;
        }

        public IEnumerable<Item> GetItems(int? townId)
        {
            var items = MyHordesOptimizerRepository.GetItems();
            var recipes = MyHordesOptimizerRepository.GetRecipes();
            foreach (var item in items)
            {
                var recipesToAdd = recipes.Where(recipe => recipe.Components.Any(component => component.Id == item.Id)).ToList();
                recipesToAdd.AddRange(recipes.Where(recipes => recipes.Result.Any(result => result.Item.Id == item.Id)));
                item.Recipes = recipesToAdd;
            }

            if (townId.HasValue) // On ne récupère les info propres à la ville uniquement si on est incarné
            {
                var wishList = MyHordesOptimizerRepository.GetWishList(townId.Value);
                var bank = MyHordesOptimizerRepository.GetBank(townId.Value);
                foreach (var item in items)
                {
                    if (wishList != null && wishList.WishList != null)
                    {
                        var wishListItems = wishList.WishList.Values.SelectMany(x => x).ToList();
                        var wishlistItem = wishListItems.FirstOrDefault(x => x.Item.Id == item.Id);
                        if (wishlistItem != null)
                        {
                            item.WishListCount = wishlistItem.Count;
                        }
                        else
                        {
                            item.WishListCount = 0;
                        }
                    }

                    var bankItem = bank.Bank.FirstOrDefault(x => x.Item.Id == item.Id);
                    if (bankItem != null)
                    {
                        item.BankCount = bankItem.Count;
                    }
                    else
                    {
                        item.BankCount = 0;
                    }
                }
            }
            return items;
        }

        public SimpleMeDto GetSimpleMe()
        {
            var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
            if (myHordeMeResponse.Map != null) // Si l'utilisateur est en ville
            {
                myHordeMeResponse.Map.LastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
                var town = Mapper.Map<Town>(myHordeMeResponse.Map);
                var townModel = Mapper.Map<TownModel>(myHordeMeResponse);

                var existingTownModel = MyHordesOptimizerRepository.GetTownModel(town.Id);

                MyHordesOptimizerRepository.PatchTown(townModel);
                MyHordesOptimizerRepository.PatchCitizen(town.Id, town.Citizens);
                MyHordesOptimizerRepository.PatchCadaver(town.Id, town.Cadavers);
                MyHordesOptimizerRepository.PutBank(town.Id, town.Bank);

                if (existingTownModel == null) // Si la ville est null, il faut créer toutes les cells
                {
                    var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
                    var idLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
                    double averageStartingItem = Math.Round((float)MyHordesScrutateurConfiguration.StartItemMin + (((float)MyHordesScrutateurConfiguration.StartItemMax - (float)MyHordesScrutateurConfiguration.StartItemMin) / 2), 3);
                    var cells = new List<MapCellModel>();
                    var xVille = myHordeMeResponse.Map.City.X;
                    var yVille = myHordeMeResponse.Map.City.Y;
                    for (var x = 0; x < myHordeMeResponse.Map.Wid; x++)
                    {
                        for (var y = 0; y < myHordeMeResponse.Map.Hei; y++)
                        {
                            var xFromTown = x - xVille;
                            var yFromTown = yVille - y;
                            bool isTown = x == myHordeMeResponse.Map.City.X && y == myHordeMeResponse.Map.City.Y;
                            double? averageStartingItemValue = averageStartingItem;
                            int? maxPotentialStartingItemValue = MyHordesScrutateurConfiguration.StartItemMax;
                            if (isTown)
                            {
                                averageStartingItemValue = null;
                                maxPotentialStartingItemValue = null;
                            }
                            int? zoneRegen = null;
                            if (xFromTown != 0 && yFromTown != 0)
                            {
                                zoneRegen = (int)GetCellZone(xFromTown, yFromTown);
                            }
                            var cell = new MapCellModel()
                            {
                                IdTown = town.Id,
                                IdLastUpdateInfo = idLastUpdateInfo,
                                X = x,
                                Y = y,
                                IsTown = isTown,
                                IsVisitedToday = false,
                                IsNeverVisited = true,
                                DangerLevel = null,
                                IsDryed = false,
                                IdRuin = null,
                                NbZombie = null,
                                NbZombieKilled = null,
                                NbHero = null,
                                IsRuinCamped = null,
                                IsRuinDryed = null,
                                NbRuinDig = null,
                                AveragePotentialRemainingDig = averageStartingItemValue,
                                MaxPotentialRemainingDig = maxPotentialStartingItemValue,
                                NbKm = GetCellDistanceInKm(xFromTown, yFromTown),
                                NbPa = GetCellDistanceInActionPoint(xFromTown, yFromTown),
                                ZoneRegen = zoneRegen
                            };
                            cells.Add(cell);
                        }
                    }
                    MyHordesOptimizerRepository.PatchMapCell(town.Id, cells, forceUpdate: false);
                }

                _ = Task.Run(() => CheckAndUpdateCellDigs(myHordeMeResponse, town.Id));
            }
            var simpleMe = Mapper.Map<SimpleMeDto>(myHordeMeResponse);

            return simpleMe;
        }

        private void CheckAndUpdateCellDigs(MyHordesMeResponseDto myHordeMeResponse, int townId)
        {
            try
            {
                // Update des fouilles, si c'est pas déjà fait
                var update = MyHordesOptimizerRepository.GetMapCellDigUpdate(townId, myHordeMeResponse.Map.Days);
                if (update == null)
                {
                    var scrutLevel = 0;
                    var scrut = myHordeMeResponse.Map.City.Buildings.SingleOrDefault(building => building.Id == MyHordesScrutateurConfiguration.Id);
                    if (scrut != null && scrut.HasLevels.HasValue)
                    {
                        scrutLevel = scrut.HasLevels.Value;
                    }
                    var regenChance = MyHordesScrutateurConfiguration.Level0;
                    switch (scrutLevel)
                    {
                        case 0:
                            regenChance = MyHordesScrutateurConfiguration.Level0;
                            break;
                        case 1:
                            regenChance = MyHordesScrutateurConfiguration.Level1;
                            break;
                        case 2:
                            regenChance = MyHordesScrutateurConfiguration.Level2;
                            break;
                        case 3:
                            regenChance = MyHordesScrutateurConfiguration.Level3;
                            break;
                        case 4:
                            regenChance = MyHordesScrutateurConfiguration.Level4;
                            break;
                        case 5:
                            regenChance = MyHordesScrutateurConfiguration.Level5;
                            break;
                    }
                    var cellsComplet = MyHordesOptimizerRepository.GetCells(townId);
                    var cells = Mapper.Map<IEnumerable<MapCellModel>>(cellsComplet);
                    RegenDirectionEnum regen = RegenDirectionEnum.All;

                    var dynamicNews = myHordeMeResponse.Map.City.News;
                    MyHordesNews news = null;
                    if (dynamicNews.GetType() == typeof(JObject))
                    {
                        var jObject = dynamicNews as JObject;
                        if (jObject != null)
                        {
                            news = jObject.ToObject<MyHordesNews>();
                        }
                    }
                    if (news != null && news.RegenDir != null)
                    {
                        var regenDirLabel = news.RegenDir.De;
                        regen = regenDirLabel.GetEnumFromDescription<RegenDirectionEnum>();
                    }
                    float averageNbOfItemAdded = ((float)MyHordesScrutateurConfiguration.MinItemAdd + ((float)MyHordesScrutateurConfiguration.MaxItemAdd - (float)MyHordesScrutateurConfiguration.MinItemAdd) / (float)2);
                    var xVille = myHordeMeResponse.Map.City.X;
                    var yVille = myHordeMeResponse.Map.City.Y;
                    foreach (var cell in cells)
                    {
                        var xFromTown = cell.X - xVille;
                        var yFromTown = yVille - cell.Y;
                        if (!(xFromTown == 0 && yFromTown == 0))
                        {
                            if (!cell.NbKm.HasValue)
                            {
                                cell.NbKm = GetCellDistanceInKm(xFromTown, yFromTown);
                            }
                            if (!cell.NbPa.HasValue)
                            {
                                cell.NbPa = GetCellDistanceInActionPoint(xFromTown, yFromTown);
                            }
                            RegenDirectionEnum cellZone;
                            if (cell.ZoneRegen.HasValue)
                            {
                                cellZone = (RegenDirectionEnum)cell.ZoneRegen.Value;
                            }
                            else
                            {
                                cellZone = GetCellZone(xFromTown, yFromTown);
                                cell.ZoneRegen = (int)cellZone;
                            }
                            if (cellZone == regen || regen == RegenDirectionEnum.All)
                            {
                                var max = cell.MaxPotentialRemainingDig ?? 0;
                                var average = cell.AveragePotentialRemainingDig ?? 0;
                                if (max < MyHordesScrutateurConfiguration.MaxItemPerCell)
                                {
                                    var itemToAdd = MyHordesScrutateurConfiguration.MaxItemAdd;
                                    if (max >= MyHordesScrutateurConfiguration.DigThrottle)
                                    {
                                        itemToAdd = Convert.ToInt32(Math.Ceiling(((float)itemToAdd - 1.0) / 2.0));
                                    }
                                    if (regen == RegenDirectionEnum.All)
                                    {
                                        itemToAdd = 0;
                                    }
                                    cell.MaxPotentialRemainingDig = max + itemToAdd;
                                }

                                double averageItemAdd = ((float)regenChance / (float)100) * averageNbOfItemAdded;
                                if (average < MyHordesScrutateurConfiguration.MaxItemPerCell)
                                {
                                    if (average >= MyHordesScrutateurConfiguration.DigThrottle)
                                    {
                                        averageItemAdd = ((float)regenChance / (float)100) * Math.Ceiling((averageNbOfItemAdded - 1.0) / 2.0);
                                    }
                                    if (regen == RegenDirectionEnum.All)
                                    {
                                        averageItemAdd = averageItemAdd / (float)8;
                                    }
                                    averageItemAdd = Math.Round(averageItemAdd, 3);
                                    cell.AveragePotentialRemainingDig = average + averageItemAdd;
                                }
                            }
                        }
                    }
                    MyHordesOptimizerRepository.InsertMapCellDigUpdate(new MapCellDigUpdateModel()
                    {
                        Day = myHordeMeResponse.Map.Days,
                        IdTown = townId,
                        DirectionRegen = (int)regen,
                        LevelRegen = scrutLevel,
                        TauxRegen = regenChance
                    });
                    MyHordesOptimizerRepository.PatchMapCell(townId, cells, forceUpdate: false);
                }
            }
            catch (Exception e)
            {
                Logger.LogWarning($"Erreur lors de la maj des fouilles restantes : {e.ToString()}");
            }
        }

        private RegenDirectionEnum GetCellZone(int x, int y)
        {
            if (Math.Abs(Math.Abs(x) - Math.Abs(y)) < Math.Min(Math.Abs(x), Math.Abs(y)))
            {
                if (x < 0 && y < 0)
                {
                    return RegenDirectionEnum.SouthWest;
                }
                if (x < 0 && y > 0)
                {
                    return RegenDirectionEnum.NorthWest;
                }
                if (x > 0 && y < 0)
                {
                    return RegenDirectionEnum.SouthEst;
                }
                if (x > 0 && y > 0)
                {
                    return RegenDirectionEnum.NorthEst;
                }
            }
            else
            {
                if (x < 0 && Math.Abs(x) > Math.Abs(y))
                {
                    return RegenDirectionEnum.West;
                }
                if (x > 0 && Math.Abs(x) > Math.Abs(y))
                {
                    return RegenDirectionEnum.Est;
                }
                if (y < 0 && Math.Abs(x) < Math.Abs(y))
                {
                    return RegenDirectionEnum.South;
                }
                if (y > 0 && Math.Abs(x) < Math.Abs(y))
                {
                    return RegenDirectionEnum.North;
                }
            }
            throw new Exception();
        }

        private int GetCellDistanceInKm(int xRelativeToTown, int yRelativetoTown)
        {
            return (int)Math.Round(Math.Sqrt(Math.Pow(xRelativeToTown, 2) + Math.Pow(yRelativetoTown, 2)));


        }
        private int GetCellDistanceInActionPoint(int xRelativeToTown, int yRelativetoTown)
        {
            return Math.Abs(xRelativeToTown) + Math.Abs(yRelativetoTown);
        }

        public IEnumerable<HeroSkill> GetHeroSkills()
        {
            var heroSkills = MyHordesOptimizerRepository.GetHeroSkills();
            return heroSkills;
        }

        public IEnumerable<CauseOfDeath> GetCausesOfDeath()
        {
            var causesOfDeath = MyHordesOptimizerRepository.GetCausesOfDeath();
            return causesOfDeath;
        }

        public IEnumerable<CleanUpType> GetCleanUpTypes()
        {
            var cleanUpTypes = MyHordesOptimizerRepository.GetCleanUpTypes();
            return cleanUpTypes;
        }

        public IEnumerable<ItemRecipe> GetRecipes()
        {
            var recipes = MyHordesOptimizerRepository.GetRecipes();
            return recipes;
        }

        public BankLastUpdate GetBank()
        {
            var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
            var town = Mapper.Map<Town>(myHordeMeResponse.Map);

            // Enregistrer en base
            MyHordesOptimizerRepository.PutBank(town.Id, town.Bank);
            town = MyHordesOptimizerRepository.GetTown(town.Id);
            var recipes = MyHordesOptimizerRepository.GetRecipes().ToList();
            var bankWrapper = town.Bank;

            if (town.WishList != null && town.WishList.WishList != null)
            {
                var wishListItems = town.WishList.WishList.Values.SelectMany(x => x).ToList();
                foreach (var bankItem in bankWrapper.Bank)
                {
                    var wishlistItem = wishListItems.FirstOrDefault(x => x.Item.Id == bankItem.Item.Id);
                    if (wishlistItem != null)
                    {
                        bankItem.WishListCount = wishlistItem.Count;
                    }
                    else
                    {
                        bankItem.WishListCount = 0;
                    }
                }
            }
            bankWrapper.Bank.ForEach(bankItem => bankItem.Item.Recipes = recipes.GetRecipeForItem(bankItem.Item.Id));
            return bankWrapper;
        }

        public CitizensLastUpdate GetCitizens(int townId)
        {
            var citizens = MyHordesOptimizerRepository.GetCitizens(townId);
            return citizens;
        }

        public IEnumerable<MyHordesOptimizerRuin> GetRuins(int? townId)
        {
            if(townId.HasValue)
            {
                var ruins = MyHordesOptimizerRepository.GetTownRuin(townId.Value);
                return ruins;
            }
            else
            {
                var ruins = MyHordesOptimizerRepository.GetRuins();
                return ruins;
            }        
        }

        public MyHordesOptimizerMapDto GetMap(int townId)
        {
            var models = MyHordesOptimizerRepository.GetCells(townId);

            var distinct = models.Distinct(new CellIdComparer());
            var map = Mapper.Map<MyHordesOptimizerMapDto>(distinct);

            var items = models.Where(x => x.ItemId.HasValue).Distinct(new ItemIdComparer());
            foreach (var item in items)
            {
                var cellItem = Mapper.Map<CellItemDto>(item);
                map.Cells.Single(cell => cell.CellId == item.IdCell).Items.Add(cellItem);
            }

            var citizens = models.Where(x => x.CitizenId.HasValue);
            var distinctCitizens = citizens.Distinct(new CitizenIdComparer());
            foreach (var citizen in distinctCitizens)
            {
                var cellCitizen = Mapper.Map<CellCitizenDto>(citizen);
                map.Cells.Single(cell => cell.CellId == citizen.IdCell).Citizens.Add(cellCitizen);
            }

            return map;
        }

        public IEnumerable<MyHordesOptimizerMapDigDto> GetMapDigs(int townId)
        {
            var models = MyHordesOptimizerRepository.GetCellsDigs(townId);
            var dtos = Mapper.Map<IEnumerable<MyHordesOptimizerMapDigDto>>(models);
            return dtos;
        }

        public List<MyHordesOptimizerMapDigDto> CreateOrUpdateMapDigs(int? townId, int userId, List<MyHordesOptimizerMapDigDto> requests)
        {
            var lastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            var idLastUpdateInfo = MyHordesOptimizerRepository.CreateLastUpdateInfo(lastUpdateInfo);
            var models = new List<MapCellDigModel>();
            foreach (var request in requests)
            {
                var model = Mapper.Map<MapCellDigModel>(request);
                model.IdLastUpdateInfo = idLastUpdateInfo;
                if (model.IdCell == 0)
                {
                    var existingCell = MyHordesOptimizerRepository.GetCell(townId.Value, request.X, request.Y);
                    model.IdCell = existingCell.IdCell;
                }
                models.Add(model);
            }
            MyHordesOptimizerRepository.PatchMapCellDig(models);
            var results = new List<MapCellDigCompletModel>();
            foreach (var model in models)
            {
                results.Add(MyHordesOptimizerRepository.GetCellDigs(model.IdCell, model.IdUser, model.Day));
            }
            var dtos = Mapper.Map<List<MyHordesOptimizerMapDigDto>>(results);
            return dtos;
        }

        public void DeleteMapDigs(int idCell, int diggerId, int day)
        {
            MyHordesOptimizerRepository.DeleteMapCellDig(idCell, diggerId, day);
        }

        public IEnumerable<MyHordesOptimizerMapUpdateDto> GetMapUpdates(int townId)
        {
            var models = MyHordesOptimizerRepository.GetMapUpdates(townId);
            var dtos = Mapper.Map<IEnumerable<MyHordesOptimizerMapUpdateDto>>(models);
            return dtos;
        }
    }
}
