using AutoMapper;
using Discord;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Exceptions;
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
                townId = DbContext.ResolveTownId(townId.Value);
                sw.Start();
                var townBankItemLastUpdateId = DbContext.TownBankItems.Where(tbi => tbi.IdTown == townId).Max(tbi => (int?)tbi.IdLastUpdateInfo);
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
                    .Include(item => item.RecipeItemComponents)
                        .ThenInclude(recipe => recipe.RecipeNameNavigation)
                        .ThenInclude(recipe => recipe.ProvokingItemNavigation)
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
                Logger.LogDebug("GetItem({@townId}) Mapper in {@ElapsedMilliseconds} ms", townId, sw.ElapsedMilliseconds);
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
                   .Include(item => item.RecipeItemComponents)
                       .ThenInclude(recipe => recipe.RecipeNameNavigation)
                       .ThenInclude(recipe => recipe.ProvokingItemNavigation)
                       .AsSplitQuery()
                   .Include(item => item.RecipeItemResults)
                   .AsSplitQuery()
                   .ToList();
                Logger.LogDebug("GetItem() FetchInDb in {@ElapsedMilliseconds} ms", sw.ElapsedMilliseconds);
                sw.Restart();
                var itemsDto = Mapper.Map<List<ItemDto>>(items);
                Logger.LogDebug("GetItem() Mapper in {@ElapsedMilliseconds} ms", sw.ElapsedMilliseconds);
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
                if (myHordeMeResponse.Map != null && !HasTownIdCollision(myHordeMeResponse)) // Si l'utilisateur est en ville
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

                    // Mise à jour de l'avatar à chaque connexion
                    // ExecuteUpdate : pas de tracking, évite tout conflit d'identité avec
                    // les User résolus plus loin (LastUpdateInfo, TownCitizen.IdUserNavigation)
                    DbContext.Users
                        .Where(u => u.IdUser == UserInfoProvider.UserId && u.Avatar != myHordeMeResponse.Avatar)
                        .ExecuteUpdate(setters => setters.SetProperty(u => u.Avatar, myHordeMeResponse.Avatar));

                    using var transaction = DbContext.Database.BeginTransaction();
                    var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(UserInfoProvider.GenerateLastUpdateInfo()));
                    DbContext.SaveChanges();
                    Logger.LogDebug($"GetSimpleMeAsync Génération du lastupdate {sw.Elapsed} ms");
                    var lastUpdate = DbContext.LastUpdateInfos.First(x => x.IdLastUpdateInfo == newLastUpdate.Entity.IdLastUpdateInfo);
                    Logger.LogDebug($"GetSimpleMeAsync Récupération du lastupdate {sw.Elapsed} ms");
                    myHordeMeResponse.Map.LastUpdateInfo = lastUpdate;
                    var town = Mapper.Map<Town>(myHordeMeResponse, opts => opts.SetDbContext(DbContext));
                    // Garde-fou : cette ville est celle où le citoyen connecté se trouve actuellement,
                    // elle ne peut donc pas être terminée, même si l'import global l'a marquée à tort
                    // (le endpoint /json/towns en bulk ne remonte parfois que des citoyens déjà morts).
                    town.IsFinished = false;
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
                        // Lignes filles déjà présentes en base pour cette ville provisoire (orphelines :
                        // la ligne Towns manque mais pas ses TownCitizen/TownCadaver). On exclut leurs clés
                        // pour n'insérer que ce qui manque, sinon violation de la PK (IdTown, IdUser).
                        HashSet<int> existingCitizenUserIds = DbContext.TownCitizens
                            .Where(citizen => citizen.IdTown == town.IdTown)
                            .Select(citizen => citizen.IdUser)
                            .ToHashSet();
                        HashSet<int> existingCadaverUserIds = DbContext.TownCadavers
                            .Where(cadaver => cadaver.IdTown == town.IdTown)
                            .Select(cadaver => cadaver.IdUser)
                            .ToHashSet();
                        // On crée les citoyens manquants (dédoublonnage + exclusion des existants ; PK (IdTown, IdUser))
                        List<TownCitizen> distinctCitizens = citizens
                            .GroupBy(citizen => citizen.IdUser)
                            .Select(group => group.First())
                            .Where(citizen => !existingCitizenUserIds.Contains(citizen.IdUser))
                            .ToList();
                        DbContext.AddRange(distinctCitizens);
                        // On crée la banque (dédoublonnage sur (IdItem, IsBroken), IdLastUpdateInfo constant ici)
                        List<TownBankItem> distinctBankItems = bankItems
                            .GroupBy(bankItem => new { bankItem.IdItem, bankItem.IsBroken })
                            .Select(group => group.First())
                            .ToList();
                        DbContext.AddRange(distinctBankItems);
                        // On crée les cadavres manquants (dédoublonnage + exclusion des existants ; PK (IdTown, IdUser))
                        List<TownCadaver> distinctCadavers = cadavers
                            .GroupBy(cadaver => cadaver.IdUser)
                            .Select(group => group.First())
                            .Where(cadaver => !existingCadaverUserIds.Contains(cadaver.IdUser))
                            .ToList();
                        DbContext.AddRange(distinctCadavers);
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
                        // On met à jour la ville (logique partagée avec les outils externes et l'import)
                        existingTown.UpdateFromMapDetails(myHordeMeResponse.Map);
                        if (myHordeMeResponse.MapId > 0)
                        {
                            existingTown.MapId = myHordeMeResponse.MapId;
                        }
                        // La langue n'est pas portée par /json/map : on la rafraîchit depuis le locale
                        // du citoyen connecté (UpdateFromMapDetails ne peut pas la déduire de la carte).
                        if (!string.IsNullOrEmpty(myHordeMeResponse.Locale))
                        {
                            existingTown.Language = myHordeMeResponse.Locale;
                        }
                        // Garde-fou : le citoyen connecté est dans cette ville, elle ne peut pas être terminée
                        existingTown.IsFinished = false;
                        DbContext.Update(existingTown);
                        // On ajoute une nouvelle banque avec un nouveau lastupdate
                        DbContext.AddRange(bankItems);
                        // On maj les citoyens en place, sans jamais supprimer de ligne :
                        // le TownCitizen d'un mort est conservé (Dead = true) et le détail
                        // qui ne remonte pas de MH (maison, actions héroïques, statuts,
                        // chaman, sac) est préservé grâce à ignoreNull
                        foreach (var c in citizens)
                        {
                            var existingCitizen = existingTown.TownCitizens.FirstOrDefault(citizen => citizen.IdUser == c.IdUser);
                            if (existingCitizen == null)
                            {
                                DbContext.Add(c);
                            }
                            else
                            {
                                existingCitizen.UpdateAllButKeysProperties(c, ignoreNull: true);
                                existingCitizen.IdLastUpdateInfo = lastUpdate.IdLastUpdateInfo;
                            }
                        }
                        // Les citoyens passés côté cadavres ne sont plus listés dans map.citizens :
                        // on marque leur ligne comme morte au lieu de la perdre
                        foreach (var cadaver in cadavers)
                        {
                            var deadCitizen = existingTown.TownCitizens.FirstOrDefault(citizen => citizen.IdUser == cadaver.IdUser);
                            if (deadCitizen != null)
                            {
                                deadCitizen.Dead = true;
                            }
                        }
                        // On maj les cadavers en place (CleanUp, renseigné à part, est préservé)
                        foreach (var cadaver in cadavers)
                        {
                            var existingCadaver = existingTown.TownCadavers.FirstOrDefault(c => c.IdUser == cadaver.IdUser);
                            if (existingCadaver == null)
                            {
                                DbContext.Add(cadaver);
                            }
                            else
                            {
                                existingCadaver.UpdateAllButKeysProperties(cadaver, ignoreNull: true);
                            }
                        }
                        // On maj les cellsdigs
                        if (DbContext.MapCellDigUpdates.FirstOrDefault(x => x.IdTown == town.IdTown && x.Day == town.Day) == null) // Si on a déjà fait la maj de la regen, il faut pas la refaire
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
                                        if (MyHordesScrutateurConfiguration.MaxItemPerCell == null || max < MyHordesScrutateurConfiguration.MaxItemPerCell)
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
                                        if (MyHordesScrutateurConfiguration.MaxItemPerCell == null || average < MyHordesScrutateurConfiguration.MaxItemPerCell)
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

                    // Pictos gagnés par les morts dans cette ville. Hors transaction et isolé pour
                    // qu'un échec ici ne casse pas la synchro de la ville.
                    try
                    {
                        UpsertCadaverPictos(town.IdTown, myHordeMeResponse.Map.Cadavers);
                        Logger.LogDebug($"GetSimpleMeAsync Pictos des cadavers {sw.Elapsed} ms");
                    }
                    catch (Exception ex)
                    {
                        Logger.LogWarning(ex, "GetSimpleMeAsync: échec de la mise à jour des pictos des cadavers");
                    }
                }

                // Historique des villes terminées du joueur (vies passées) : on les importe / marque
                // comme terminées. Indépendant du fait que le joueur soit actuellement en ville, et
                // isolé pour qu'un échec ici ne casse pas la synchro de la ville courante.
                //
                // UNIQUEMENT au premier import (date nulle). Cet upsert réécrit tout l'historique —
                // >100 villes pour un vétéran, ~2,3 s en moyenne et jusqu'à 10 s mesurées — sous le
                // verrou global, alors que son résultat ne change qu'en fin de ville. Le faire à
                // chaque connexion plafonnait le débit à ~0,5 req/s : au pic de minuit la file
                // atteignait 15 min et nginx renvoyait des 502. Les rafraîchissements suivants
                // passent par l'import des pictos, dont le playedMaps est un sur-ensemble strict.
                if (!DbContext.Users.Any(u => u.IdUser == UserInfoProvider.UserId && u.PlayedMapsImportedAt != null))
                {
                    try
                    {
                        UpsertPlayedMaps(myHordeMeResponse.PlayedMaps, UserInfoProvider.UserId);
                    }
                    catch (Exception ex)
                    {
                        Logger.LogWarning(ex, "GetSimpleMeAsync: échec de la mise à jour des playedMaps");
                    }
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

        // Une ligne provisoire (pas encore migrée vers son townId stable) vit sous IdTown = -mapId,
        // un espace qui ne peut jamais entrer en collision avec un vrai townId (toujours positif).
        // Le seul risque résiduel : un mapId recyclé d'une saison à l'autre retombant sur une ancienne
        // ligne provisoire jamais migrée. On la détecte via la saison et on refuse de la réutiliser.
        private bool HasTownIdCollision(MyHordesMeResponseDto myHordeMeResponse)
        {
            var mapId = myHordeMeResponse.MapId;
            var season = myHordeMeResponse.Map?.Season;
            var existing = DbContext.Towns.FirstOrDefault(t => t.IdTown == -mapId);
            if (existing == null) return false;
            if (!existing.Season.HasValue || !season.HasValue || existing.Season.Value == season.Value) return false;

            Logger.LogError(
                "GetSimpleMeAsync: mapId {MapId} recyclé — ligne provisoire existante (saison={ExistingSeason}) incompatible avec la ville actuelle (saison={CurrentSeason}). Synchronisation ignorée pour ne pas écraser une ville différente.",
                mapId, existing.Season, season);
            return true;
        }

        // Pictos obtenus par chaque mort DANS cette ville (champ `rewards` des cadavers).
        // Le référentiel Picto est complété à la volée : `rewards` porte les libellés dans les
        // 4 langues demandées, mais pas `community`, qui reste donc à sa valeur par défaut.
        // Ne couvre que les morts : les pictos d'un survivant ne remontent jamais par cette voie.
        private void UpsertCadaverPictos(int townId, List<MyHordesCadaver> cadavers)
        {
            var cadaversWithPictos = cadavers?
                .Where(cadaver => cadaver.Rewards != null && cadaver.Rewards.Count > 0)
                .ToList();
            if (cadaversWithPictos == null || cadaversWithPictos.Count == 0)
            {
                return;
            }

            var rewards = cadaversWithPictos.SelectMany(cadaver => cadaver.Rewards.Values).ToList();

            // Référentiel d'abord : Picto porte la FK de TownCitizenPicto
            var pictoIds = rewards.Select(reward => reward.Id).Distinct().ToList();
            var knownPictoIds = DbContext.Pictos
                .Where(picto => pictoIds.Contains(picto.IdPicto))
                .Select(picto => picto.IdPicto)
                .ToHashSet();
            foreach (var reward in rewards.GroupBy(reward => reward.Id).Select(group => group.First()))
            {
                if (knownPictoIds.Contains(reward.Id))
                {
                    continue;
                }
                DbContext.Pictos.Add(new Picto()
                {
                    IdPicto = reward.Id,
                    Img = MyHordesExtensions.RemoveImageFingerprint(reward.Img) ?? string.Empty,
                    NameFr = GetLabelForLanguage(reward.Name, "fr"),
                    NameEn = GetLabelForLanguage(reward.Name, "en"),
                    NameEs = GetLabelForLanguage(reward.Name, "es"),
                    NameDe = GetLabelForLanguage(reward.Name, "de"),
                    DescFr = GetLabelForLanguage(reward.Desc, "fr"),
                    DescEn = GetLabelForLanguage(reward.Desc, "en"),
                    DescEs = GetLabelForLanguage(reward.Desc, "es"),
                    DescDe = GetLabelForLanguage(reward.Desc, "de"),
                    Rare = reward.Rare
                });
                knownPictoIds.Add(reward.Id);
            }

            var lastUpdate = DateTime.UtcNow;
            var existingLines = DbContext.TownCitizenPictos
                .Where(picto => picto.IdTown == townId)
                .ToList();
            foreach (var cadaver in cadaversWithPictos)
            {
                foreach (var reward in cadaver.Rewards.Values)
                {
                    var existingLine = existingLines.FirstOrDefault(line => line.IdUser == cadaver.Id && line.IdPicto == reward.Id);
                    if (existingLine == null)
                    {
                        DbContext.TownCitizenPictos.Add(new TownCitizenPicto()
                        {
                            IdTown = townId,
                            IdUser = cadaver.Id,
                            IdPicto = reward.Id,
                            Count = reward.Number,
                            LastUpdate = lastUpdate
                        });
                    }
                    else
                    {
                        existingLine.Count = reward.Number;
                        existingLine.LastUpdate = lastUpdate;
                    }
                }
            }
            DbContext.SaveChanges();
        }

        private static string GetLabelForLanguage(IDictionary<string, string> labels, string language)
        {
            return labels != null && labels.TryGetValue(language, out var label) ? label : null;
        }

        // Délai minimal entre deux imports de pictos d'un même joueur. L'appel est le plus lourd de
        // MyHordes (une requête SQL par ville jouée, sans cache de leur côté) et n'importe qui peut
        // le déclencher depuis n'importe quel profil : sans cette garde, la fonctionnalité serait
        // intenable. Les pictos ne bougeant qu'en fin de ville, un jour de fraîcheur suffit.
        private static readonly TimeSpan PictosImportMinimumInterval = TimeSpan.FromHours(24);

        /// <summary>
        /// Importe le total des pictos d'un joueur et le détail de son historique par ville, en un
        /// seul appel MyHordes. Renvoie false sans rien faire si l'import est déjà récent.
        /// </summary>
        public bool ImportUserPictos(int userId)
        {
            var user = DbContext.Users.FirstOrDefault(u => u.IdUser == userId);
            if (user == null)
            {
                throw new MhoTechnicalException($"Utilisateur introuvable : {userId}");
            }
            if (user.PictosHistoryImportedAt.HasValue
                && DateTime.UtcNow - user.PictosHistoryImportedAt.Value < PictosImportMinimumInterval)
            {
                Logger.LogDebug("ImportUserPictos: import ignoré pour {UserId}, déjà fait le {Date}", userId, user.PictosHistoryImportedAt);
                return false;
            }

            var response = MyHordesJsonApiRepository.GetUserPictos(userId);

            // L'import crée / met à jour des lignes Town, comme la synchronisation de ville : sans ce
            // verrou, deux écritures concurrentes sur la même ville se marcheraient dessus. Il n'est
            // pris qu'ici, une fois l'appel réseau terminé — le tenir pendant les ~15s de la requête
            // bloquerait toutes les synchronisations pour rien (même découpage que GetSimpleMeAsync).
            Lock.Wait();
            try
            {
                PersistUserPictos(response, userId);
            }
            finally
            {
                Lock.Release();
            }
            return true;
        }

        private void PersistUserPictos(MyHordesUserPictosDto response, int userId)
        {
            // Les villes de l'historique doivent exister avant d'y rattacher des pictos (FK).
            // Attention : UpsertPlayedMaps se termine par un ChangeTracker.Clear(). Toute entité
            // chargée avant lui est détachée, et la modifier ensuite ne partirait jamais en base —
            // sans la moindre erreur. Rien ne doit donc être chargé avant cet appel pour être écrit
            // après (le `user` l'était, et sa date d'import était silencieusement perdue).
            UpsertPlayedMaps(response.PlayedMaps, userId);

            var lastUpdate = DateTime.UtcNow;
            var rewards = response.Rewards ?? new List<MyHordesReward>();
            var pictosByTown = (response.PlayedMaps ?? new List<MyHordesPlayedMapDto>())
                .Where(played => played.MapId.HasValue && played.Rewards != null && played.Rewards.Count > 0)
                .ToList();

            // Référentiel : les deux sources décrivent les pictos dans les 4 langues, et doivent être
            // créées avant tout compteur (FK). Aucune ne porte `community`, qui reste à sa valeur par
            // défaut. Le total et l'historique ne se recouvrent pas exactement (le total inclut les
            // imports Twinoid, l'historique peut contenir des villes alpha exclues du total).
            var knownPictoIds = DbContext.Pictos.Select(picto => picto.IdPicto).ToHashSet();
            foreach (var reward in rewards.Where(reward => !knownPictoIds.Contains(reward.Id)))
            {
                DbContext.Pictos.Add(new Picto()
                {
                    IdPicto = reward.Id,
                    Img = MyHordesExtensions.RemoveImageFingerprint(reward.Img) ?? string.Empty,
                    NameFr = reward.Name?.Fr,
                    NameEn = reward.Name?.En,
                    NameEs = reward.Name?.Es,
                    NameDe = reward.Name?.De,
                    DescFr = reward.Desc?.Fr,
                    DescEn = reward.Desc?.En,
                    DescEs = reward.Desc?.Es,
                    DescDe = reward.Desc?.De,
                    Rare = reward.Rare != 0
                });
                knownPictoIds.Add(reward.Id);
            }
            var describedRewards = pictosByTown
                .SelectMany(played => played.Rewards.Values)
                .GroupBy(reward => reward.Id)
                .Select(group => group.First())
                .ToList();
            foreach (var reward in describedRewards.Where(reward => !knownPictoIds.Contains(reward.Id)))
            {
                DbContext.Pictos.Add(new Picto()
                {
                    IdPicto = reward.Id,
                    Img = MyHordesExtensions.RemoveImageFingerprint(reward.Img) ?? string.Empty,
                    NameFr = GetLabelForLanguage(reward.Name, "fr"),
                    NameEn = GetLabelForLanguage(reward.Name, "en"),
                    NameEs = GetLabelForLanguage(reward.Name, "es"),
                    NameDe = GetLabelForLanguage(reward.Name, "de"),
                    DescFr = GetLabelForLanguage(reward.Desc, "fr"),
                    DescEn = GetLabelForLanguage(reward.Desc, "en"),
                    DescEs = GetLabelForLanguage(reward.Desc, "es"),
                    DescDe = GetLabelForLanguage(reward.Desc, "de"),
                    Rare = reward.Rare
                });
                knownPictoIds.Add(reward.Id);
            }
            DbContext.SaveChanges();

            // Total du joueur
            var existingTotals = DbContext.UserPictos.Where(picto => picto.IdUser == userId).ToList();
            foreach (var reward in rewards)
            {
                var existingTotal = existingTotals.FirstOrDefault(picto => picto.IdPicto == reward.Id);
                if (existingTotal == null)
                {
                    DbContext.UserPictos.Add(new UserPicto()
                    {
                        IdUser = userId,
                        IdPicto = reward.Id,
                        Count = reward.Number,
                        LastUpdate = lastUpdate
                    });
                }
                else
                {
                    existingTotal.Count = reward.Number;
                    existingTotal.LastUpdate = lastUpdate;
                }
            }

            // Détail par ville
            var existingTownPictos = DbContext.TownCitizenPictos.Where(picto => picto.IdUser == userId).ToList();
            foreach (var played in pictosByTown)
            {
                var townId = DbContext.ResolveTownId(played.MapId.Value);
                foreach (var reward in played.Rewards.Values)
                {
                    var existingLine = existingTownPictos.FirstOrDefault(line => line.IdTown == townId && line.IdPicto == reward.Id);
                    if (existingLine == null)
                    {
                        DbContext.TownCitizenPictos.Add(new TownCitizenPicto()
                        {
                            IdTown = townId,
                            IdUser = userId,
                            IdPicto = reward.Id,
                            Count = reward.Number,
                            LastUpdate = lastUpdate
                        });
                    }
                    else
                    {
                        existingLine.Count = reward.Number;
                        existingLine.LastUpdate = lastUpdate;
                    }
                }
            }

            // Rechargé ici, et non réutilisé depuis l'appelant : le ChangeTracker.Clear() de
            // UpsertPlayedMaps aurait détaché l'instance chargée en amont.
            var user = DbContext.Users.First(u => u.IdUser == userId);
            user.PictosHistoryImportedAt = lastUpdate;
            DbContext.SaveChanges();
            Logger.LogInformation("ImportUserPictos: {PictoCount} pictos et {TownCount} villes importés pour {UserId}",
                rewards.Count, pictosByTown.Count, userId);
        }

        // Importe / met à jour les villes de l'historique du joueur (playedMaps = vies passées).
        // Ce sont toujours des villes TERMINÉES : on peut donc les marquer IsFinished sans ambiguïté,
        // et on récupère au passage type + score + nom + saison (indisponibles via /json/towns).
        // Seul le mapId est fourni (pas le townId réel) → on clé par ligne provisoire -mapId, qu'un
        // import groupé ultérieur pourra migrer vers le townId stable. Un mapId pouvant être recyclé
        // d'une saison à l'autre, on ne réutilise une ligne existante que si la saison est compatible.
        // `userId` est le joueur À QUI appartient cet historique : ce n'est pas toujours le joueur
        // connecté (l'import de pictos passe l'historique d'un tiers), et s'y tromper rattacherait
        // les villes d'autrui au compte courant.
        private void UpsertPlayedMaps(List<MyHordesPlayedMapDto> playedMaps, int userId)
        {
            if (playedMaps == null || playedMaps.Count == 0)
            {
                // Rien à importer, mais l'import a bien eu lieu : sans cette marque, un joueur sans
                // historique (premier séjour) le retenterait à chacune de ses connexions.
                MarkPlayedMapsImported(userId);
                return;
            }

            // L'historique peut compter >100 villes (127 observées en réel) : on charge toutes les lignes
            // candidates en UNE requête (par townId réel via MapId, ou par clé provisoire -mapId) plutôt
            // qu'une requête par entrée.
            var mapIds = playedMaps.Where(p => p.MapId.HasValue).Select(p => p.MapId.Value).Distinct().ToList();
            if (mapIds.Count == 0)
            {
                MarkPlayedMapsImported(userId);
                return;
            }
            var provisionalIds = mapIds.Select(id => -id).ToList();
            var existingTowns = DbContext.Towns
                .Where(t => (t.MapId.HasValue && mapIds.Contains(t.MapId.Value)) || provisionalIds.Contains(t.IdTown))
                .ToList();

            // IdTown des villes de l'historique effectivement traitées : sert ensuite à rattacher
            // le joueur courant à ces villes via TownCitizen (le profil liste les villes par ce lien).
            var processedTownIds = new HashSet<int>();

            foreach (var played in playedMaps)
            {
                if (!played.MapId.HasValue)
                {
                    continue;
                }
                var mapId = played.MapId.Value;

                var candidates = existingTowns
                    .Where(t => t.MapId == mapId || t.IdTown == -mapId)
                    .ToList();
                var town = candidates.FirstOrDefault(t =>
                    !t.Season.HasValue || !played.Season.HasValue || t.Season.Value == played.Season.Value);

                if (town == null)
                {
                    // Aucune ligne compatible. Si -mapId est déjà occupé par une ville d'une autre saison,
                    // on ne l'écrase pas (même garde-fou que HasTownIdCollision).
                    if (candidates.Any(t => t.IdTown == -mapId))
                    {
                        Logger.LogWarning("UpsertPlayedMaps: mapId {MapId} recyclé (ligne provisoire d'une autre saison) — entrée ignorée.", mapId);
                        continue;
                    }
                    town = new Town { IdTown = -mapId, MapId = mapId };
                    DbContext.Towns.Add(town);
                    existingTowns.Add(town);
                }

                processedTownIds.Add(town.IdTown);

                town.IsFinished = true;
                if (!string.IsNullOrEmpty(played.MapName))
                {
                    town.Name = played.MapName;
                }
                if (played.Season.HasValue)
                {
                    town.Season = played.Season;
                }
                if (played.Score.HasValue)
                {
                    town.Score = played.Score;
                }
                if (played.Day.HasValue)
                {
                    town.Day = played.Day.Value;
                }
                var phase = TownExtensions.MapTownPhase(played.Phase);
                if (phase != null)
                {
                    town.PhaseId = (int)phase;
                }
                var type = TownExtensions.MapTownType(played.Type);
                if (type != null)
                {
                    town.TownTypeId = (int)type;
                }
            }

            DbContext.SaveChanges();

            // Rattache le joueur à chacune de ses villes d'historique. Sans ce lien TownCitizen,
            // ses villes terminées n'apparaîtraient pas dans son profil (qui liste les villes via
            // TownCitizen) : sur une ville terminée, le joueur n'est plus présent dans map.citizens et
            // n'est donc jamais rattaché par la synchro classique. On ne crée que les liens manquants,
            // et seulement si l'utilisateur existe déjà en base (playedMaps peut arriver hors ville).
            if (userId > 0 && processedTownIds.Count > 0 && DbContext.Users.Any(u => u.IdUser == userId))
            {
                var townIdList = processedTownIds.ToList();
                var alreadyLinked = new HashSet<int>(DbContext.TownCitizens
                    .Where(c => c.IdUser == userId && townIdList.Contains(c.IdTown))
                    .Select(c => c.IdTown)
                    .ToList());
                LastUpdateInfo systemLastUpdate = null;
                foreach (var townId in processedTownIds)
                {
                    if (alreadyLinked.Contains(townId))
                    {
                        continue;
                    }
                    if (systemLastUpdate == null)
                    {
                        // LastUpdateInfo « système » partagé : rattachement non lié à une synchro précise.
                        systemLastUpdate = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
                        DbContext.LastUpdateInfos.Add(systemLastUpdate);
                    }
                    DbContext.TownCitizens.Add(new TownCitizen
                    {
                        IdTown = townId,
                        IdUser = userId,
                        IsImmuneToSoul = false,
                        IdLastUpdateInfoNavigation = systemLastUpdate
                    });
                }
                DbContext.SaveChanges();
            }

            DbContext.ChangeTracker.Clear();
            MarkPlayedMapsImported(userId);
        }

        /// <summary>
        /// Date le dernier import de l'historique des villes du joueur. C'est elle qui dispense la
        /// synchronisation de connexion de refaire ce travail à chaque getMe.
        /// ExecuteUpdate et non une entité suivie : UpsertPlayedMaps se termine par un
        /// ChangeTracker.Clear() qui détacherait tout User chargé, et l'écriture serait perdue en
        /// silence. Un joueur absent de la table n'est pas mis à jour (0 ligne) : sa date reste nulle
        /// et l'import sera retenté à sa prochaine connexion, une fois son compte créé.
        /// </summary>
        private void MarkPlayedMapsImported(int userId)
        {
            if (userId <= 0)
            {
                return;
            }
            DbContext.Users
                .Where(u => u.IdUser == userId)
                .ExecuteUpdate(setters => setters.SetProperty(u => u.PlayedMapsImportedAt, DateTime.UtcNow));
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
                .Include(recipe => recipe.ProvokingItemNavigation)
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
                var allItems = DbContext.Items
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
                    .Include(item => item.RecipeItemComponents)
                        .ThenInclude(recipe => recipe.RecipeNameNavigation)
                        .ThenInclude(recipe => recipe.ProvokingItemNavigation)
                        .AsSplitQuery()
                    .Include(item => item.RecipeItemResults)
                    .ToList();
                var newTownlastUpdate = DbContext.LastUpdateInfos.First(x => x.IdLastUpdateInfo == newLastUpdate.IdLastUpdateInfo);
                myHordeMeResponse.Map.LastUpdateInfo = newTownlastUpdate;
                var town = Mapper.Map<Town>(myHordeMeResponse, opts => { opts.SetDbContext(DbContext); opts.SetAllItems(allItems); });
                DbContext.AddRange(town.TownBankItems);
                DbContext.SaveChanges();
                transaction.Commit();
                lastUpdateId = newTownlastUpdate.IdLastUpdateInfo;
            }
            catch (Exception e)
            {
                Logger.LogError(e, $"Erreur lors de l'enregistrement de la bank depuis MH : {e}");
            }
            var townDetail = UserInfoProvider.TownDetail;
            var townId = DbContext.ResolveTownId(townDetail.TownId);
            return GetBankFromDb(townId, lastUpdateId);
        }

        public BankLastUpdateDto GetBank(int townId)
        {
            var resolvedTownId = DbContext.ResolveTownId(townId);
            return GetBankFromDb(resolvedTownId, -1);
        }

        private BankLastUpdateDto GetBankFromDb(int townId, int lastUpdateId)
        {
            if (lastUpdateId == -1)
            {
                lastUpdateId = DbContext.TownBankItems.Where(tbi => tbi.IdTown == townId).Max(tbi => (int?)tbi.IdLastUpdateInfo) ?? -1;
            }
            if (lastUpdateId == -1)
            {
                // Aucune banque connue pour cette ville (jamais synchronisée)
                return new BankLastUpdateDto()
                {
                    Bank = new List<StackableItemDto>(),
                    LastUpdateInfo = null
                };
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
                      .ThenInclude(item => item.RecipeItemComponents)
                         .ThenInclude(recipe => recipe.RecipeNameNavigation)
                         .ThenInclude(recipe => recipe.ProvokingItemNavigation)
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
            townId = DbContext.ResolveTownId(townId);
            var models = DbContext.GetTownCitizen(townId)
                .ToList();
            var dtos = Mapper.Map<CitizensLastUpdateDto>(models);
            // Détail des cadavres : TownCadaver n'a pas de navigation depuis TownCitizen
            // (PK (idTown, idUser) partagée mais sans FK), on l'affecte donc à la main.
            var cadaverByUser = DbContext.TownCadavers
                .Where(cadaver => cadaver.IdTown == townId)
                .Include(cadaver => cadaver.CauseOfDeathNavigation)
                .Include(cadaver => cadaver.CleanUpNavigation)
                .Include(cadaver => cadaver.IdUserNavigation)
                .ToList()
                .ToDictionary(cadaver => cadaver.IdUser);
            foreach (var citizen in dtos.Citizens.Where(citizen => citizen.Dead))
            {
                if (cadaverByUser.TryGetValue(citizen.Id, out var cadaverModel))
                {
                    citizen.Cadaver = Mapper.Map<CadaverDto>(cadaverModel);
                }
            }
            return dtos;
        }

        public IEnumerable<MyHordesOptimizerRuinDto> GetRuins(int? townId)
        {
            if (townId.HasValue)
            {
                townId = DbContext.ResolveTownId(townId.Value);
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
            townId = DbContext.ResolveTownId(townId);
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
                .Include(town => town.MapCells)
                    .ThenInclude(mapCell => mapCell.IdScoutEstimationLastUpdateInfoNavigation)
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
            townId = DbContext.ResolveTownId(townId);
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
            townId = DbContext.ResolveTownId(townId);
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
            townId = DbContext.ResolveTownId(townId);
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
            /** Non implémenté ici
            // Cas centre
            if (x == 0 && y == 0)
                return DirectionEnum.Center;
            */

            if (x == 0 && y > 0) return DirectionEnum.North;
            if (x == 0 && y < 0) return DirectionEnum.South;
            if (x > 0 && y == 0) return DirectionEnum.Est;
            if (x < 0 && y == 0) return DirectionEnum.West;

            double deg = x != 0 || y != 0
                ? (180.0 / Math.PI) * Math.Asin(x / Math.Sqrt((double)(x * x + y * y)))
                : 0.0;

            if (y > 0)
            {
                if (deg >= 67.5) return DirectionEnum.Est;
                if (deg >= 22.5) return DirectionEnum.NorthEst;
                if (deg >= -22.5) return DirectionEnum.North;
                if (deg >= -67.5) return DirectionEnum.NorthWest;
                return DirectionEnum.West;
            }
            else
            {
                if (deg >= 67.5) return DirectionEnum.Est;
                if (deg >= 22.5) return DirectionEnum.SouthEst;
                if (deg >= -22.5) return DirectionEnum.South;
                if (deg >= -67.5) return DirectionEnum.SouthWest;
                return DirectionEnum.West;
            }
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
