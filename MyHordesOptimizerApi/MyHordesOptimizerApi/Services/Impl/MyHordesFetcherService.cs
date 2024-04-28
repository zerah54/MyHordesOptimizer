using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Extensions.Models;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class MyHordesFetcherService : IMyHordesFetcherService
    {
        public static SemaphoreSlim Lock = new SemaphoreSlim(1);
        protected ILogger<MyHordesFetcherService> Logger { get; set; }
        protected IMyHordesApiRepository MyHordesJsonApiRepository { get; set; }
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IMyHordesCodeRepository MyHordesCodeRepository { get; set; }
        protected IMyHordesScrutateurConfiguration MyHordesScrutateurConfiguration { get; set; }
        protected readonly IMapper Mapper;
        protected IUserInfoProvider UserInfoProvider { get; set; }
        protected MhoContext DbContext { get; set; }

        public MyHordesFetcherService(ILogger<MyHordesFetcherService> logger,
            IMyHordesApiRepository myHordesJsonApiRepository,
            IServiceScopeFactory serviceScopeFactory,
            IMyHordesCodeRepository myHordesCodeRepository,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            IMyHordesScrutateurConfiguration myHordesScrutateurConfiguration,
            MhoContext mhoContext)
        {
            Logger = logger;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            ServiceScopeFactory = serviceScopeFactory;
            MyHordesCodeRepository = myHordesCodeRepository;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            MyHordesScrutateurConfiguration = myHordesScrutateurConfiguration;
            DbContext = mhoContext;
        }

        public IEnumerable<ItemDto> GetItems(int? townId)
        {
            var sw = new Stopwatch();
            if (townId.HasValue)
            {
                sw.Start();
                var townBankItemLastUpdateId = DbContext.TownBankItems.Where(tbi => tbi.IdTown == townId).Max(tbi => tbi.IdLastUpdateInfo);
                var items = DbContext.Items
                    .Include(item => item.IdCategoryNavigation)
                    .AsSplitQuery()
                    .Include(item => item.PropertyNames)
                    .AsSplitQuery()
                    .Include(item => item.ActionNames)
                    .AsSplitQuery()
                    .Include(item => item.RecipeItemComponents)
                        .ThenInclude(recipe => recipe.RecipeNameNavigation)
                        .ThenInclude(recipe => recipe.RecipeItemResults)
                        .AsSplitQuery()
                    .Include(item => item.RecipeItemResults)
                    .AsSplitQuery()
                    .Include(item => item.TownBankItems.Where(bankItem => bankItem.IdTown == townId && bankItem.IdLastUpdateInfo == townBankItemLastUpdateId))
                    .AsSplitQuery()
                    .Include(item => item.TownWishListItems.Where(wishListItem => wishListItem.IdTown == townId))
                    .AsSplitQuery()
                    .ToList();
                Logger.LogDebug("GetItem({@townId}) FetchInDb in {@ElapsedMilliseconds} ms", townId, sw.ElapsedMilliseconds);
                sw.Restart();
                var itemsDto = Mapper.Map<List<ItemDto>>(items);
                Logger.LogDebug("GetItem({@townId}) MApper in {@ElapsedMilliseconds} ms", townId, sw.ElapsedMilliseconds);
                sw.Stop();
                return itemsDto;
            }
            else
            {
                sw.Start();
                var items = DbContext.Items
                   .Include(item => item.IdCategoryNavigation)
                   .AsSplitQuery()
                   .Include(item => item.PropertyNames)
                   .AsSplitQuery()
                   .Include(item => item.ActionNames)
                   .AsSplitQuery()
                   .Include(item => item.RecipeItemComponents)
                       .ThenInclude(recipe => recipe.RecipeNameNavigation)
                       .ThenInclude(recipe => recipe.RecipeItemResults)
                       .AsSplitQuery()
                   .Include(item => item.RecipeItemResults)
                   .AsSplitQuery()
                   .ToList();
                Logger.LogDebug("GetItem() FetchInDb in {@ElapsedMilliseconds} ms", sw.ElapsedMilliseconds);
                sw.Restart();
                var itemsDto = Mapper.Map<List<ItemDto>>(items);
                Logger.LogDebug("GetItem() MApper in {@ElapsedMilliseconds} ms", sw.ElapsedMilliseconds);
                sw.Stop();
                return itemsDto;
            }

        }

        public async Task<SimpleMeDto> GetSimpleMeAsync()
        {
            var sw = new Stopwatch();
            sw.Start();
            var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
            Logger.LogDebug($"GetSimpleMeAsync MyHordesJsonApiRepository.GetMe() après {sw.Elapsed} ms");
            Logger.LogDebug("GetSimpleMeAsync Waiting for Lock");
            await Lock.WaitAsync();
            Logger.LogDebug($"GetSimpleMeAsync Lock ok après {sw.Elapsed} ms");
            try
            {
                if (myHordeMeResponse.Map != null) // Si l'utilisateur est en ville
                {
                    Logger.LogDebug($"GetSimpleMeAsync User en ville !");

                    if (!DbContext.Users.Any(u => u.IdUser == UserInfoProvider.UserId))
                    {
                        Logger.LogDebug($"GetSimpleMeAsync Création du user en DB");

                        var user = Mapper.Map<User>(myHordeMeResponse);
                        DbContext.Add(user);
                        DbContext.SaveChanges();
                        DbContext.ChangeTracker.Clear();
                        Logger.LogDebug($"GetSimpleMeAsync Création du user en DB après {sw.Elapsed} ms");
                    }
                    using var transaction = DbContext.Database.BeginTransaction();
                    var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(UserInfoProvider.GenerateLastUpdateInfo()));
                    DbContext.SaveChanges();
                    Logger.LogDebug($"GetSimpleMeAsync Génération du lastupdate {sw.Elapsed} ms");
                    var lastUpdate = DbContext.LastUpdateInfos.First(x => x.IdLastUpdateInfo == newLastUpdate.Entity.IdLastUpdateInfo);
                    Logger.LogDebug($"GetSimpleMeAsync Récupération du lastupdate {sw.Elapsed} ms");
                    myHordeMeResponse.Map.LastUpdateInfo = lastUpdate;
                    var town = Mapper.Map<Town>(myHordeMeResponse, opts => opts.SetDbContext(DbContext));
                    var citizens = town.TownCitizens;
                    town.TownCitizens = null;
                    var bankItems = town.TownBankItems;
                    town.TownBankItems = null;
                    var cadavers = town.TownCadavers;
                    town.TownCadavers = null;
                    var existingTown = DbContext.Towns
                        .Include(town => town.TownCitizens)
                        .Include(town => town.TownCadavers)
                        .FirstOrDefault(t => t.IdTown == town.IdTown);
                    Logger.LogDebug($"GetSimpleMeAsync Récupération de la town {sw.Elapsed} ms");
                    if (existingTown == null)
                    {
                        Logger.LogDebug($"GetSimpleMeAsync La Town n'existe pas !");
                        // On Crée la ville
                        DbContext.Add(town);
                        // On crée les citoyen
                        DbContext.AddRange(citizens);
                        // On crée la banque
                        DbContext.AddRange(bankItems);
                        // On crée les cadavers
                        DbContext.AddRange(cadavers);
                        // On crée les cells
                        var cells = CreateCellsForTown(xVille: myHordeMeResponse.Map.City.X,
                            yVille: myHordeMeResponse.Map.City.Y,
                            mapWid: myHordeMeResponse.Map.Wid,
                            mapHei: myHordeMeResponse.Map.Hei,
                            townId: town.IdTown,
                            lastUpdate);
                        DbContext.AddRange(cells);
                        DbContext.SaveChanges();
                        Logger.LogDebug($"GetSimpleMeAsync Création de la Town après {sw.Elapsed} ms");
                    }
                    else
                    {
                        Logger.LogDebug($"GetSimpleMeAsync La Town existe {town.IdTown} !");
                        // On met à jour la ville
                        existingTown.UpdateNoNullProperties(town);
                        DbContext.Update(existingTown);
                        // On ajoute une nouvelle banque avec un nouveau lastupdate
                        DbContext.AddRange(bankItems);
                        // On maj les citoyen en gardant tout ce qui remonte pas de MH
                        DbContext.RemoveRange(existingTown.TownCitizens);
                        foreach (var citizen in existingTown.TownCitizens)
                        {
                            foreach (var c in citizens)
                            {
                                if (c.IdUser == citizen.IdUser)
                                {
                                    c.ImportHomeDetail(citizen);
                                    c.ImportHeroicActionDetail(citizen);
                                    c.ImportStatusDetail(citizen);
                                    c.ImportChamanicDetail(citizen);
                                    c.IdBag = citizen.IdBag;
                                }
                            }
                        }
                        DbContext.AddRange(citizens);
                        // On maj les cadavers
                        DbContext.RemoveRange(existingTown.TownCadavers);
                        DbContext.AddRange(cadavers);
                        // On maj les cellsdigs
                        if (DbContext.MapCellDigUpdates.FirstOrDefault(x => x.IdTown == town.IdTown) == null) // Si on a déjà fait la maj de la regen, il faut pas la refaire
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
                            var cells = DbContext.MapCells.Where(c => c.IdTown == town.IdTown)
                                .ToList();
                            DirectionEnum regen = DirectionEnum.All;

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
                                regen = regenDirLabel.GetEnumFromDescription<DirectionEnum>();
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
                                    DirectionEnum cellZone;
                                    if (cell.ZoneRegen.HasValue)
                                    {
                                        cellZone = (DirectionEnum)cell.ZoneRegen.Value;
                                    }
                                    else
                                    {
                                        cellZone = GetCellZone(xFromTown, yFromTown);
                                        cell.ZoneRegen = (int)cellZone;
                                    }
                                    if (cellZone == regen || regen == DirectionEnum.All)
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
                                            if (regen == DirectionEnum.All)
                                            {
                                                itemToAdd = 0;
                                            }
                                            cell.MaxPotentialRemainingDig = max + itemToAdd;
                                        }

                                        float averageItemAdd = ((float)regenChance / (float)100) * averageNbOfItemAdded;
                                        if (average < MyHordesScrutateurConfiguration.MaxItemPerCell)
                                        {
                                            if (average >= MyHordesScrutateurConfiguration.DigThrottle)
                                            {
                                                averageItemAdd = ((float)regenChance / (float)100) * (float)Math.Ceiling((averageNbOfItemAdded - 1.0) / 2.0);
                                            }
                                            if (regen == DirectionEnum.All)
                                            {
                                                averageItemAdd = averageItemAdd / (float)8;
                                            }
                                            averageItemAdd = (float)Math.Round(averageItemAdd, 3);
                                            cell.AveragePotentialRemainingDig = average + averageItemAdd;
                                        }
                                    }
                                }
                            }
                            var mapCellDigUpdate = new MapCellDigUpdate()
                            {
                                Day = myHordeMeResponse.Map.Days,
                                IdTown = town.IdTown,
                                DirectionRegen = (int)regen,
                                LevelRegen = scrutLevel,
                                TauxRegen = regenChance
                            };
                            DbContext.Add(mapCellDigUpdate);
                            DbContext.UpdateRange(cells);
                        }
                        DbContext.SaveChanges();
                        Logger.LogDebug($"GetSimpleMeAsync Update de toute la Town après {sw.Elapsed} ms");
                    }
                    transaction.Commit();
                    Logger.LogDebug($"GetSimpleMeAsync Transaction commit {sw.Elapsed} ms");
                }
                var simpleMe = Mapper.Map<SimpleMeDto>(myHordeMeResponse);

                return simpleMe;
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {
                Lock.Release();
                Logger.LogDebug($"GetSimpleMeAsync Lock released {sw.Elapsed} ms");
            }
        }

        public IEnumerable<HeroSkillDto> GetHeroSkills()
        {
            var models = DbContext.HeroSkills.ToList();
            var dtos = Mapper.Map<List<HeroSkillDto>>(models);
            return dtos;
        }

        public IEnumerable<CauseOfDeathDto> GetCausesOfDeath()
        {
            var models = DbContext.CauseOfDeaths.ToList();
            var dtos = Mapper.Map<List<CauseOfDeathDto>>(models);
            return dtos;
        }

        public IEnumerable<CleanUpTypeDto> GetCleanUpTypes()
        {
            var models = DbContext.TownCadaverCleanUpTypes.ToList();
            var dtos = Mapper.Map<List<CleanUpTypeDto>>(models);
            return dtos;
        }

        public IEnumerable<ItemRecipeDto> GetRecipes()
        {
            var models = DbContext.Recipes
                .Include(recipe => recipe.RecipeItemComponents)
                    .ThenInclude(item => item.IdItemNavigation)
                .Include(recipe => recipe.RecipeItemResults)
                    .ThenInclude(item => item.IdItemNavigation)
                .ToList();
            var dtos = Mapper.Map<List<ItemRecipeDto>>(models);
            return dtos;
        }

        public BankLastUpdateDto GetBank()
        {
            int lastUpdateId = -1;
            try
            {
                var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
                // Enregistrer en base
                using var transaction = DbContext.Database.BeginTransaction();
                var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(UserInfoProvider.GenerateLastUpdateInfo())).Entity;
                DbContext.SaveChanges();
                var newTownlastUpdate = DbContext.LastUpdateInfos.First(x => x.IdLastUpdateInfo == newLastUpdate.IdLastUpdateInfo);
                myHordeMeResponse.Map.LastUpdateInfo = newTownlastUpdate;
                var town = Mapper.Map<Town>(myHordeMeResponse, opts => opts.SetDbContext(DbContext));
                DbContext.AddRange(town.TownBankItems);
                DbContext.SaveChanges();
                transaction.Commit();
                lastUpdateId = newTownlastUpdate.IdLastUpdateInfo;
            }
            catch (Exception e)
            {
                Logger.LogError($"Erreur lors de l'enregistrement de la bank depuis MH : {e}");
            }
            var townDetail = UserInfoProvider.TownDetail;
            var townId = townDetail.TownId;
            if (lastUpdateId == -1)
            {
                lastUpdateId = DbContext.TownBankItems.Where(tbi => tbi.IdTown == townId).Max(tbi => tbi.IdLastUpdateInfo);
            }
            var townModel = DbContext.Towns
                .Where(town => town.IdTown == townId)
                .Include(town => town.TownBankItems.Where(tbi => tbi.IdLastUpdateInfo == lastUpdateId))
                  .ThenInclude(townBankItem => townBankItem.IdItemNavigation)
                      .ThenInclude(item => item.IdCategoryNavigation)
                      .AsSplitQuery()
                .Include(town => town.TownBankItems.Where(tbi => tbi.IdLastUpdateInfo == lastUpdateId))
                  .ThenInclude(townBankItem => townBankItem.IdItemNavigation)
                      .ThenInclude(item => item.PropertyNames)
                      .AsSplitQuery()
                .Include(town => town.TownBankItems.Where(tbi => tbi.IdLastUpdateInfo == lastUpdateId))
                 .ThenInclude(townBankItem => townBankItem.IdItemNavigation)
                      .ThenInclude(item => item.ActionNames)
                      .AsSplitQuery()
                .Include(town => town.TownBankItems.Where(tbi => tbi.IdLastUpdateInfo == lastUpdateId))
                  .ThenInclude(townBankItem => townBankItem.IdItemNavigation)
                      .ThenInclude(item => item.RecipeItemComponents)
                         .ThenInclude(recipe => recipe.RecipeNameNavigation)
                         .ThenInclude(recipe => recipe.RecipeItemResults)
                         .AsSplitQuery()
                .Include(town => town.TownBankItems.Where(tbi => tbi.IdLastUpdateInfo == lastUpdateId))
                    .ThenInclude(townBankItem => townBankItem.IdItemNavigation)
                        .ThenInclude(item => item.RecipeItemResults)
                        .AsSplitQuery()
                .Include(town => town.TownBankItems.Where(tbi => tbi.IdLastUpdateInfo == lastUpdateId))
                    .ThenInclude(townBankItem => townBankItem.IdItemNavigation)
                        .ThenInclude(item => item.TownWishListItems.Where(wishListItem => wishListItem.IdTown == townId))
                        .AsSplitQuery()
                .Include(town => town.TownBankItems.Where(tbi => tbi.IdLastUpdateInfo == lastUpdateId))
                    .ThenInclude(townBankItem => townBankItem.IdLastUpdateInfoNavigation)
                    .AsSplitQuery()
                .First();

            var group = townModel.TownBankItems.GroupBy(townBankItem => townBankItem.IdLastUpdateInfoNavigation)
                .OrderByDescending(g => g.Key.DateUpdate)
                .First();

            var lastUpdate = group.Key;
            var townBankItemsLastUpdated = group.ToList();
            var dtos = Mapper.Map<List<StackableItemDto>>(townBankItemsLastUpdated);
            LastUpdateInfoDto lastUpdateDto = null;
            if (townModel.TownBankItems.Any())
            {
                lastUpdateDto = Mapper.Map<LastUpdateInfoDto>(lastUpdate);
            }
            return new BankLastUpdateDto()
            {
                Bank = dtos,
                LastUpdateInfo = lastUpdateDto
            };
        }

        public CitizensLastUpdateDto GetCitizens(int townId)
        {
            var models = DbContext.GetTownCitizen(townId)
                .ToList();
            var dtos = Mapper.Map<CitizensLastUpdateDto>(models);
            return dtos;
        }

        public IEnumerable<MyHordesOptimizerRuinDto> GetRuins(int? townId)
        {
            if (townId.HasValue)
            {
                var models = DbContext.MapCells
                     .Where(cell => cell.IdTown == townId)
                     .Where(cell => cell.IdRuin.HasValue)
                     .Include(mapCell => mapCell.IdRuinNavigation)
                      .ThenInclude(ruin => ruin.RuinItemDrops)
                       .ThenInclude(itemRuinDrop => itemRuinDrop.IdItemNavigation)
                          .ThenInclude(item => item.ActionNames)
                          .AsSplitQuery()
                     .Include(mapCell => mapCell.IdRuinNavigation)
                      .ThenInclude(ruin => ruin.RuinItemDrops)
                       .ThenInclude(itemRuinDrop => itemRuinDrop.IdItemNavigation)
                          .ThenInclude(item => item.PropertyNames)
                          .AsSplitQuery()
                     .Include(mapCell => mapCell.IdRuinNavigation)
                      .ThenInclude(ruin => ruin.RuinItemDrops)
                       .ThenInclude(itemRuinDrop => itemRuinDrop.IdItemNavigation)
                          .ThenInclude(item => item.IdCategoryNavigation)
                          .AsSplitQuery()
                     .Select(cell => cell.IdRuinNavigation)
                     .ToList()
                     .DistinctBy(ruin => ruin.IdRuin);
                ;
                var dtos = Mapper.Map<List<MyHordesOptimizerRuinDto>>(models);
                return dtos;
            }
            else
            {
                var models = DbContext.Ruins
                   .Include(ruin => ruin.RuinItemDrops)
                     .ThenInclude(itemRuinDrop => itemRuinDrop.IdItemNavigation)
                        .ThenInclude(item => item.ActionNames)
                   .Include(ruin => ruin.RuinItemDrops)
                     .ThenInclude(itemRuinDrop => itemRuinDrop.IdItemNavigation)
                        .ThenInclude(item => item.PropertyNames)
                   .Include(ruin => ruin.RuinItemDrops)
                     .ThenInclude(itemRuinDrop => itemRuinDrop.IdItemNavigation)
                        .ThenInclude(item => item.IdCategoryNavigation)
                   .ToList();
                var dtos = Mapper.Map<List<MyHordesOptimizerRuinDto>>(models);
                return dtos;
            }
        }

        public MyHordesOptimizerMapDto GetMap(int townId)
        {
            var model = DbContext.Towns
                .Where(cell => cell.IdTown == townId)
                .Include(town => town.MapCells)
                    .ThenInclude(mapCell => mapCell.MapCellItems)
                        .ThenInclude(mapCellItem => mapCellItem.IdItemNavigation)
                        .AsSplitQuery()
                .Include(town => town.MapCells)
                    .ThenInclude(mapCell => mapCell.IdLastUpdateInfoNavigation)
                        .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                        .AsSplitQuery()
                .Include(town => town.TownCitizens)
                    .ThenInclude(townCitizen => townCitizen.IdUserNavigation)
                    .AsSplitQuery()
                .Include(town => town.MapCells)
                    .ThenInclude(mapCell => mapCell.MapCellDigs)
                    .AsSplitQuery()
                .AsNoTracking()
                .FirstOrDefault();
            var dto = Mapper.Map<MyHordesOptimizerMapDto>(model);
            return dto;
        }

        public IEnumerable<MyHordesOptimizerMapDigDto> GetMapDigs(int townId)
        {
            var model = DbContext.Towns
                .Where(town => town.IdTown == townId)
                .Include(town => town.MapCells)
                    .ThenInclude(mapCell => mapCell.MapCellDigs)
                        .ThenInclude(digs => digs.IdUserNavigation)
                        .AsSplitQuery()
                .Include(town => town.MapCells)
                    .ThenInclude(mapCell => mapCell.MapCellDigs)
                        .ThenInclude(digs => digs.IdLastUpdateInfoNavigation)
                            .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                            .AsSplitQuery()
                .AsNoTracking()
                .First();
            var dtos = Mapper.Map<List<MyHordesOptimizerMapDigDto>>(model);
            return dtos;
        }

        public List<MyHordesOptimizerMapDigDto> CreateOrUpdateMapDigs(int townId, int userId, List<MyHordesOptimizerMapDigDto> requests)
        {
            using var transaction = DbContext.Database.BeginTransaction();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(UserInfoProvider.GenerateLastUpdateInfo(), opt => opt.SetDbContext(DbContext)));
            DbContext.SaveChanges();
            var models = Mapper.Map<List<MapCellDig>>(requests, opt =>
            {
                opt.SetLastUpdateInfoId(newLastUpdate.Entity.IdLastUpdateInfo);
                opt.SetDbContext(DbContext);
                opt.SetTownId(townId);
            });
            var toAdd = new List<MapCellDig>();
            var toUpdate = new List<MapCellDig>();
            foreach (var model in models)
            {
                if (DbContext.MapCellDigs.Any(x => x.IdCell == model.IdCell && x.IdUser == model.IdUser && x.Day == model.Day))
                {
                    toUpdate.Add(model);
                }
                else
                {
                    toAdd.Add(model);
                }
            }
            DbContext.AddRange(toAdd);
            DbContext.UpdateRange(toUpdate);
            DbContext.SaveChanges();
            transaction.Commit();

            var dtos = Mapper.Map<List<MyHordesOptimizerMapDigDto>>(models);
            return dtos;
        }

        public void DeleteMapDigs(int idCell, int diggerId, int day)
        {
            var models = DbContext.MapCellDigs.Where(x => x.IdCell == idCell && x.IdUser == diggerId && x.Day == day)
                .ToList();
            DbContext.RemoveRange(models);
            DbContext.SaveChanges();
        }

        public IEnumerable<MyHordesOptimizerMapUpdateDto> GetMapUpdates(int townId)
        {
            var models = DbContext.MapCellDigUpdates.Where(x => x.IdTown == townId)
                .ToList();
            var dtos = Mapper.Map<List<MyHordesOptimizerMapUpdateDto>>(models);
            return dtos;
        }

        #region Private helpers
        #region MapCells
        private List<MapCell> CreateCellsForTown(int xVille, int yVille, int mapWid, int mapHei, int townId, LastUpdateInfo lastUpdate)
        {
            var cells = new List<MapCell>();
            float averageStartingItem = (float)Math.Round((float)MyHordesScrutateurConfiguration.StartItemMin + (((float)MyHordesScrutateurConfiguration.StartItemMax - (float)MyHordesScrutateurConfiguration.StartItemMin) / 2), 3);
            for (var x = 0; x < mapWid; x++)
            {
                for (var y = 0; y < mapHei; y++)
                {
                    var xFromTown = x - xVille;
                    var yFromTown = yVille - y;
                    bool isTown = x == xVille && y == yVille;
                    float? averageStartingItemValue = averageStartingItem;
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
                    var cell = new MapCell()
                    {
                        IdTown = townId,
                        IdLastUpdateInfo = lastUpdate.IdLastUpdateInfo,
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

            return cells;
        }
        private DirectionEnum GetCellZone(int x, int y)
        {
            if (Math.Abs(Math.Abs(x) - Math.Abs(y)) < Math.Min(Math.Abs(x), Math.Abs(y)))
            {
                if (x < 0 && y < 0)
                {
                    return DirectionEnum.SouthWest;
                }
                if (x < 0 && y > 0)
                {
                    return DirectionEnum.NorthWest;
                }
                if (x > 0 && y < 0)
                {
                    return DirectionEnum.SouthEst;
                }
                if (x > 0 && y > 0)
                {
                    return DirectionEnum.NorthEst;
                }
            }
            else
            {
                if (x < 0 && Math.Abs(x) > Math.Abs(y))
                {
                    return DirectionEnum.West;
                }
                if (x > 0 && Math.Abs(x) > Math.Abs(y))
                {
                    return DirectionEnum.Est;
                }
                if (y < 0 && Math.Abs(x) < Math.Abs(y))
                {
                    return DirectionEnum.South;
                }
                if (y > 0 && Math.Abs(x) < Math.Abs(y))
                {
                    return DirectionEnum.North;
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
        #endregion
        #endregion
    }
}
