using AutoMapper;
using Common.Core.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using MyHordesOptimizerApi.Services.Interfaces.Translations;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Action = MyHordesOptimizerApi.Models.Action;

namespace MyHordesOptimizerApi.Services.Impl.Import
{
    public class MyHordesImportService : IMyHordesImportService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected readonly IWebApiRepository WebApiRepository;
        protected readonly IMyHordesTranslationsConfiguration TranslationsConfiguration;
        protected readonly ITranslationService TranslationService;

        protected IMyHordesApiRepository MyHordesApiRepository;
        protected IMyHordesCodeRepository MyHordesCodeRepository;
        protected readonly IMapper Mapper;

        protected readonly ILogger<MyHordesImportService> Logger;
        protected MhoContext DbContext { get; set; }


        public MyHordesImportService(IServiceScopeFactory serviceScopeFactory,
            IWebApiRepository webApiRepository,
            IMyHordesTranslationsConfiguration translationsConfiguration,
            IMyHordesApiRepository myHordesJsonApiRepository,
            IMyHordesCodeRepository myHordesCodeRepository,
            ITranslationService translationService,
            IMapper mapper,
            ILogger<MyHordesImportService> logger,
            MhoContext dbContext)
        {
            ServiceScopeFactory = serviceScopeFactory;
            WebApiRepository = webApiRepository;
            TranslationsConfiguration = translationsConfiguration;
            MyHordesApiRepository = myHordesJsonApiRepository;
            MyHordesCodeRepository = myHordesCodeRepository;
            TranslationService = translationService;
            Mapper = mapper;
            Logger = logger;
            DbContext = dbContext;
        }


        public async Task ImportAllAsync()
        {
            await ImportJobsAsync();
            DbContext.ChangeTracker.Clear();
            await ImportHeroSkill();
            DbContext.ChangeTracker.Clear();
            await ImportCategoriesAsync();
            DbContext.ChangeTracker.Clear();
            await ImportItemsAsync();
            DbContext.ChangeTracker.Clear();
            await ImportCauseOfDeath();
            DbContext.ChangeTracker.Clear();
            ImportCleanUpTypes();
            DbContext.ChangeTracker.Clear();
            await ImportBuildingAsync();
            DbContext.ChangeTracker.Clear();
            ImportRuins();
            DbContext.ChangeTracker.Clear();
            ImportWishlistCategorie();
            DbContext.ChangeTracker.Clear();
            ImportDefaultWishlists();
            DbContext.ChangeTracker.Clear();
        }

        #region Jobs

        public Task ImportJobsAsync()
        {
            var jobs = MyHordesCodeRepository.GetJobs();
            var jobsModel = Mapper.Map<List<Job>>(jobs);

            var jobsFromDb = DbContext.Jobs
               .ToList();
            DbContext.Patch(jobsFromDb, jobsModel);

            return Task.CompletedTask;
        }

        #endregion

        #region HeroSkill

        public async Task ImportHeroSkill()
        {
            var codeCapacities = MyHordesCodeRepository.GetHeroCapacities();
            var capacities = Mapper.Map<List<HeroSkill>>(codeCapacities);

            // Traduction
            var translations = await TranslationService.GetTranslations();
            foreach (var capacitie in capacities)
            {
                capacitie.LabelFr = translations["fr"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(capacitie.LabelDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[capacitie.LabelDe])
                    .First();
                capacitie.LabelEn = translations["en"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(capacitie.LabelDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[capacitie.LabelDe])
                    .First();
                capacitie.LabelEs = translations["es"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(capacitie.LabelDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[capacitie.LabelDe])
                    .First();
                capacitie.DescriptionFr = translations["fr"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(capacitie.DescriptionDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[capacitie.DescriptionDe])
                    .First();
                capacitie.DescriptionEn = translations["en"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(capacitie.DescriptionDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[capacitie.DescriptionDe])
                    .First();
                capacitie.DescriptionEs = translations["es"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(capacitie.DescriptionDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[capacitie.DescriptionDe])
                    .First();
            }

            var heroSkills = DbContext.HeroSkills.ToList();
            var comparer = EqualityComparerFactory.Create<HeroSkill>(heroSkill => heroSkill.Name.GetHashCode(), (a, b) => a.Name == b.Name);
            DbContext.Patch(heroSkills, capacities, comparer);
        }

        #endregion

        #region CauseOfDeath

        public async Task ImportCauseOfDeath()
        {
            var codeResult = MyHordesCodeRepository.GetCausesOfDeath();

            var causesOfDeaths = Mapper.Map<List<CauseOfDeath>>(codeResult);

            // Traduction
            var translations = await TranslationService.GetTranslations();
            foreach (var causeOfDeath in causesOfDeaths)
            {

                causeOfDeath.LabelFr = translations["fr"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(causeOfDeath.LabelDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[causeOfDeath.LabelDe])
                    .First();
                causeOfDeath.LabelEn = translations["en"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(causeOfDeath.LabelDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[causeOfDeath.LabelDe])
                    .First();
                causeOfDeath.LabelEs = translations["es"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(causeOfDeath.LabelDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[causeOfDeath.LabelDe])
                    .First();
                causeOfDeath.DescriptionFr = translations["fr"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(causeOfDeath.DescriptionDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[causeOfDeath.DescriptionDe])
                    .First();
                causeOfDeath.DescriptionEn = translations["en"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(causeOfDeath.DescriptionDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[causeOfDeath.DescriptionDe])
                    .First();
                causeOfDeath.DescriptionEs = translations["es"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(causeOfDeath.DescriptionDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[causeOfDeath.DescriptionDe])
                    .First();
            }

            var causeOfDeathsFromDb = DbContext.CauseOfDeaths.ToList();
            var comparer = EqualityComparerFactory.Create<CauseOfDeath>(causeOfDeath => causeOfDeath.Dtype.GetHashCode(), (a, b) => a.Dtype == b.Dtype);
            DbContext.Patch(causeOfDeathsFromDb, causesOfDeaths, comparer);
        }

        #endregion

        #region CleanUpTypes

        public void ImportCleanUpTypes()
        {
            var codeResult = MyHordesCodeRepository.GetCleanUpTypes();

            var cleanUpTypes = Mapper.Map<List<TownCadaverCleanUpType>>(codeResult);

            var cleanUpTypesFromDb = DbContext.TownCadaverCleanUpTypes.ToList();
            var comparer = EqualityComparerFactory.Create<TownCadaverCleanUpType>(cleanUpType => cleanUpType.IdType.GetHashCode(), (a, b) => a.IdType == b.IdType);
            DbContext.Patch(cleanUpTypesFromDb, cleanUpTypes, comparer);
        }

        #endregion

        #region Items

        public async Task ImportItemsAsync()
        {
            using var transaction = DbContext.Database.BeginTransaction();
            // Récupération des items
            var myHordesItems = MyHordesApiRepository.GetItems();

            var mhoItems = Mapper.Map<List<Item>>(myHordesItems);
            // Enrichissement avec les droprates
            var droprates = MyHordesCodeRepository.GetItemsDropRates();
            var listOfPrafDrops = droprates.GetValueOrDefault("empty_dig");
            var totalWeightPraf = 0.0;
            foreach (var kvp in listOfPrafDrops)
            {
                totalWeightPraf += Convert.ToInt32(kvp.Value[0]);
            }
            var listOfNotPrafDrops = droprates.GetValueOrDefault("base_dig");
            var totalWeightNotPraf = 0.0;
            foreach (var kvp in listOfNotPrafDrops)
            {
                totalWeightNotPraf += Convert.ToInt32(kvp.Value[0]);
            }
            mhoItems.ForEach(item =>
            {
                if (listOfPrafDrops.TryGetValue(item.Uid, out var dropWeight))
                {
                    item.DropRatePraf = Convert.ToSingle(Convert.ToInt32(dropWeight[0]) / totalWeightPraf);
                }
                else
                {
                    item.DropRatePraf = 0;
                }
            });
            mhoItems.ForEach(item =>
            {
                if (listOfNotPrafDrops.TryGetValue(item.Uid, out var dropWeight))
                {
                    item.DropRateNotPraf = Convert.ToSingle(Convert.ToInt32(dropWeight[0]) / totalWeightNotPraf);
                }
                else
                {
                    item.DropRateNotPraf = 0;
                }
            });

            var itemComparer = EqualityComparerFactory.Create<Item>(item => item.IdItem.GetHashCode(), (a, b) => a.IdItem == b.IdItem);
            var existingItems = DbContext.Items.ToList();
            DbContext.Patch(existingItems, mhoItems, itemComparer);
            existingItems = DbContext.Items.ToList();

            // Récupération des properties
            var codeItemsProperty = MyHordesCodeRepository.GetItemsProperties();
            var allProperties = codeItemsProperty.Values.ToList().SelectMany(list => list).Distinct().ToList();

            var itemByProperty = new Dictionary<string, List<Item>>();
            foreach (var kvp in codeItemsProperty) // On reverse la map pour pouvoir patch les properties
            {
                var itemUid = kvp.Key;
                var properties = kvp.Value;
                foreach (var prop in properties)
                {
                    Func<Item, bool> predicate = item => item.Uid == itemUid;
                    PopulateMapFromSourceBasedOnPredicate(map: itemByProperty, src: existingItems, key: prop, predicate: predicate);
                }
            }
            var propertiesFromDb = DbContext.Properties.ToList();
            var updatedProperties = itemByProperty.Select(kvp => propertiesFromDb.FirstOrDefault(prop => prop.Name == kvp.Key, new Property() { Name = kvp.Key, IdItems = kvp.Value }))
                .ToList();
            var propertyComparer = EqualityComparerFactory.Create<Property>(prop => prop.Name.GetHashCode(), (a, b) => a.Name == b.Name);
            DbContext.Patch(propertiesFromDb, updatedProperties, propertyComparer);

            // Récupération des actions
            var codeItemsActions = MyHordesCodeRepository.GetItemsActions();
            var allActions = codeItemsActions.Values.ToList().SelectMany(list => list).Distinct().ToList();

            var itemByAction = new Dictionary<string, List<Item>>();
            foreach (var kvp in codeItemsActions) // On reverse la map pour pouvoir patch les actions
            {
                var itemUid = kvp.Key;
                var actions = kvp.Value;
                foreach (var action in actions)
                {
                    Func<Item, bool> predicate = item => item.Uid == itemUid;
                    PopulateMapFromSourceBasedOnPredicate(map: itemByAction, src: existingItems, key: action, predicate: predicate);
                }
            }
            var actionsFromDb = DbContext.Actions.ToList();
            var updatedActions = itemByAction.Select(kvp => actionsFromDb.FirstOrDefault(action => action.Name == kvp.Key, new Action() { Name = kvp.Key, IdItems = kvp.Value }))
                .ToList();
            var actionComparer = EqualityComparerFactory.Create<Action>(action => action.Name.GetHashCode(), (a, b) => a.Name == b.Name);
            DbContext.Patch(actionsFromDb, updatedActions, actionComparer);

            //Récupération des recipes
            var codeItemRecipes = MyHordesCodeRepository.GetRecipes();
            DbContext.ChangeTracker.Clear();
            var mhoRecipes = Mapper.Map<List<Recipe>>(codeItemRecipes, opt => opt.SetDbContext(DbContext));
            DbContext.ChangeTracker.Clear();

            // Traduction
            var translations = await TranslationService.GetTranslations();
            foreach (var recipe in mhoRecipes)
            {
                if (recipe.ActionDe != null)
                {
                    recipe.ActionFr = translations["fr"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(recipe.ActionDe))
                        .Select(ymlFileModel => ymlFileModel.Translations[recipe.ActionDe])
                        .First();
                    recipe.ActionEn = translations["en"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(recipe.ActionDe))
                        .Select(ymlFileModel => ymlFileModel.Translations[recipe.ActionDe])
                        .First();
                    recipe.ActionEs = translations["es"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(recipe.ActionDe))
                        .Select(ymlFileModel => ymlFileModel.Translations[recipe.ActionDe])
                        .First();
                }
            }
            var recipesFromDb = DbContext.Recipes.ToList();
            var recipeComparer = EqualityComparerFactory.Create<Recipe>(recipe => recipe.Name.GetHashCode(), (a, b) => a.Name == b.Name);
            DbContext.Patch(recipesFromDb, mhoRecipes, recipeComparer);

            DbContext.Database.ExecuteSqlRaw("DELETE FROM RecipeItemComponent");
            DbContext.Database.ExecuteSqlRaw("DELETE FROM RecipeItemResult");
            foreach (var kvp in codeItemRecipes)
            {
                var recipeName = kvp.Key;
                var componentUids = kvp.Value.In;
                var grouping = componentUids.GroupBy(x => x).Select(x => new { Count = x.Count(), Uid = x.Key });
                foreach (var group in grouping) // On add les recipes components
                {
                    var newRecipeComponent = new RecipeItemComponent()
                    {
                        Count = group.Count,
                        IdItemNavigation = existingItems.Single(item => item.Uid == group.Uid),
                        RecipeName = recipeName
                    };
                    DbContext.Add(newRecipeComponent);
                }
                try // On add les recipes results
                {
                    var resultsObjects = kvp.Value.Out;
                    var results = new List<RecipeItemResult>();
                    var totalWeight = 0;
                    foreach (var @object in resultsObjects)
                    {
                        if (@object is string)
                        {
                            var uid = @object as string;
                            results.Add(new RecipeItemResult()
                            {
                                IdItem = mhoItems.Where(i => i.Uid == uid).Select(i => i.IdItem).First(),
                                Probability = 1,
                                Weight = 0,
                                RecipeName = recipeName
                            });
                        }
                        else if (@object is JArray)
                        {
                            var jArray = @object as JArray;
                            var uid = jArray.First().Value<string>();
                            var weight = jArray.Last().Value<int>();
                            totalWeight += weight;
                            results.Add(new RecipeItemResult()
                            {
                                IdItem = mhoItems.Where(i => i.Uid == uid).Select(i => i.IdItem).First(),
                                Weight = weight,
                                RecipeName = recipeName
                            });
                        }
                    }
                    results.ForEach(x => { if (x.Probability != 1) x.Probability = (float)x.Weight / totalWeight; });
                    //MyHordesOptimizerRepository.PatchRecipeResults(results);
                    DbContext.RecipeItemResults.AddRange(results);
                }
                catch (Exception e)
                {
                    Logger.LogError(e, $"Erreur lors de l'enregistrement des réulstats de la recette {recipeName}");
                }
            }
            DbContext.SaveChanges();
            transaction.Commit();
        }

        private static void PopulateMapFromSourceBasedOnPredicate<T>(Dictionary<string, List<T>> map, List<T> src, string key, Func<T, bool> predicate) where T : class
        {
            if (map.TryGetValue(key, out var items))
            {
                if (!items.Any(predicate))
                {
                    items.AddRange(src.Where(predicate));
                }
            }
            else
            {
                map[key] = new List<T>(src.Where(predicate));
            }
        }

        #endregion

        #region Building

        public async Task ImportBuildingAsync()
        {
            var buildingsDto = await MyHordesApiRepository.GetBuildingAsync();
            var buildingCodes = MyHordesCodeRepository.GetBuildings();

            var buildingModels = Mapper.Map<List<Building>>(buildingsDto);
            buildingModels = buildingModels.OrderBy(x => x.IdBuildingParent).ToList();

            foreach (var buildingCode in buildingCodes)
            {
                var buildingModel = buildingModels.First(building => building.Uid == buildingCode.Key);
                buildingModel.WatchSurvivalBonusUpgradeLevelRequired = buildingCode.Value.WatchSurvivalBonusUpgradeLevelRequired;
            }
            var buildingFromDb = DbContext.Buildings
            .Include(building => building.BuildingRessources)
            .ToList();
            DbContext.Patch(buildingFromDb, buildingModels);


            var buildingWatchSurvivalJobs = new List<BuildingWatchSurvivalBonusJob>();
            foreach (var buildingCode in buildingCodes)
            {
                var buildingModel = buildingModels.First(building => building.Uid == buildingCode.Key);
                foreach (var job in buildingCode.Value.WatchSurvivalBonusJob)
                {
                    var buildingWatchSurvivalJob = new BuildingWatchSurvivalBonusJob()
                    {
                        IdBuilding = buildingModel.IdBuilding,
                        JobUid = job,
                        WatchSurvivalBonus = buildingCode.Value.WatchSurvivalBonus
                    };
                    buildingWatchSurvivalJobs.Add(buildingWatchSurvivalJob);
                }
            }

            var buildingSurvivalJobsFromDb = DbContext.BuildingWatchSurvivalBonusJobs
                .ToList();
            var comparer = EqualityComparerFactory.Create<BuildingWatchSurvivalBonusJob>(buildingSurvivalJob => HashCode.Combine(buildingSurvivalJob.JobUid, buildingSurvivalJob.IdBuilding),
                (a, b) => a.JobUid == b.JobUid && a.IdBuilding == b.IdBuilding);
            DbContext.Patch(buildingSurvivalJobsFromDb, buildingWatchSurvivalJobs, comparer);
        }

        #endregion

        #region Ruins

        public void ImportRuins()
        {
            var ruinsFromMyHordes = MyHordesApiRepository.GetRuins();
            var ruinModels = Mapper.Map<List<Ruin>>(ruinsFromMyHordes);

            var ruinsFromCode = MyHordesCodeRepository.GetRuins();
            var ruins = Mapper.Map<List<Ruin>>(ruinsFromCode);

            foreach (var ruinModel in ruinModels)
            {
                if (ruinsFromCode.TryGetValue(ruinModel.Img, out var ruinFromCode))
                {
                    var totalWeight = 0;
                    foreach (var drop in ruinFromCode.Drops)
                    {
                        totalWeight += Convert.ToInt32(drop.Value[0]);
                        var item = DbContext.Items.Single(x => x.Uid == drop.Key);
                        ruinModel.RuinItemDrops.Add(new RuinItemDrop()
                        {
                            IdItem = item.IdItem,
                            Weight = Convert.ToInt32(drop.Value[0])
                        });
                    }
                    ruinModel.RuinItemDrops.ToList().ForEach(x => x.Probability = (float?)x.Weight / totalWeight);
                    ruinModel.Camping = ruinFromCode.Camping;
                    ruinModel.Capacity = ruinFromCode.Capacity;
                    ruinModel.Chance = ruinFromCode.Chance;
                    ruinModel.MaxDist = ruinFromCode.MaxDist;
                    ruinModel.MinDist = ruinFromCode.MinDist;
                }
            }

            ruinModels.Add(new Ruin()
            {
                IdRuin = -1,
                Camping = 15,
                LabelFr = "Bâtiment non déterré",
                LabelEn = "Buried building",
                LabelEs = "Sector inexplotable",
                LabelDe = "Verschüttete Ruine",
                Chance = 0,
                Explorable = false,
                Img = "burried",
                MinDist = 1,
                MaxDist = 1000,
                Capacity = 0
            });

            var ruinsFromDb = DbContext.Ruins
                .Include(ruin => ruin.RuinItemDrops)
                .ToList();
            var ruinComparer = EqualityComparerFactory.Create<Ruin>(ruin => ruin.IdRuin.GetHashCode(), (a, b) => a.IdRuin == b.IdRuin);
            DbContext.Patch(ruinsFromDb, ruinModels, ruinComparer);

            // Plan des chantier de ruin
            var blueprints = new List<RuinBlueprint>();
            foreach (var ruinModel in ruinModels)
            {
                if (ruinsFromCode.TryGetValue(ruinModel.Img, out var ruinFromCode))
                {
                    if (ruinFromCode.Constructions is not null)
                    {
                        foreach (var buildingId in ruinFromCode.Constructions)
                        {
                            blueprints.Add(new RuinBlueprint()
                            {
                                IdBuilding = buildingId,
                                IdRuin = ruinModel.IdRuin
                            });
                        }
                    }
                }
            }
            var ruinBlueprintsFromDb = DbContext.RuinBlueprints
              .ToList();
            var comparer = EqualityComparerFactory.Create<RuinBlueprint>(blueprint => HashCode.Combine(blueprint.IdBuilding, blueprint.IdRuin),
               (a, b) => a.IdBuilding == b.IdBuilding && a.IdRuin == b.IdRuin);
            DbContext.Patch(ruinBlueprintsFromDb, blueprints, comparer);
        }

        #endregion

        #region Categories

        public async Task ImportCategoriesAsync()
        {
            var codeResult = MyHordesCodeRepository.GetCategories();
            var categories = Mapper.Map<List<Category>>(codeResult);

            // Traduction
            var translations = await TranslationService.GetTranslations();
            foreach (var category in categories)
            {
                category.LabelFr = translations["fr"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(category.LabelDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[category.LabelDe])
                    .First();
                category.LabelEn = translations["en"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(category.LabelDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[category.LabelDe])
                    .First();
                category.LabelEs = translations["es"].Where(ymlFileModel => ymlFileModel.Translations.ContainsKey(category.LabelDe))
                    .Select(ymlFileModel => ymlFileModel.Translations[category.LabelDe])
                    .First();
            }

            var comparer = EqualityComparerFactory.Create<Category>(category => category.Name.GetHashCode(), (a, b) => a.Name == b.Name);
            var existingCategories = DbContext.Categories.ToList();
            DbContext.Patch(existingCategories, categories, comparer);
        }

        #endregion

        #region Wishlist

        public void ImportWishlistCategorie()
        {
            var wishlistCategories = MyHordesCodeRepository.GetWishlistItemCategories();
            var models = Mapper.Map<List<WishlistCategorie>>(wishlistCategories, opt => opt.SetDbContext(DbContext));

            var wishListCategoriesFromDb = DbContext.WishlistCategories
                .Include(wishListCategorie => wishListCategorie.IdItems)
                .ToList();
            var wishListCategoryComparer = EqualityComparerFactory.Create<WishlistCategorie>(wlc => wlc.IdCategory.GetHashCode(), (a, b) => a.IdCategory == b.IdCategory);
            DbContext.Patch(wishListCategoriesFromDb, models, wishListCategoryComparer);
        }

        public void ImportDefaultWishlists()
        {
            var defaultWishlists = MyHordesCodeRepository.GetDefaultWishlists();

            var modeles = new List<DefaultWishlistItem>();
            foreach (var wishlist in defaultWishlists)
            {
                foreach (var item in wishlist.Items)
                {
                    modeles.Add(new DefaultWishlistItem()
                    {
                        IdDefaultWishlist = wishlist.Id,
                        IdItem = item.ItemId,
                        Name = wishlist.Name["fr"],
                        LabelFr = wishlist.Name["fr"],
                        LabelEn = wishlist.Name["en"],
                        LabelEs = wishlist.Name["es"],
                        LabelDe = wishlist.Name["de"],
                        Count = item.Count,
                        Depot = Convert.ToBoolean(item.Depot),
                        ShouldSignal = item.ShouldSignal,
                        Priority = item.Priority,
                        ZoneXpa = item.ZoneXPa
                    });
                }
                foreach (var categorie in wishlist.Categories)
                {
                    var wishlistCategorie = DbContext.WishlistCategories
                        .Include(wlc => wlc.IdItems)
                        .Single(x => x.IdCategory == categorie.CategorieId);
                    foreach (var item in wishlistCategorie.IdItems)
                    {
                        modeles.Add(new DefaultWishlistItem()
                        {
                            IdDefaultWishlist = wishlist.Id,
                            IdItem = item.IdItem,
                            Name = wishlist.Name["fr"],
                            LabelFr = wishlist.Name["fr"],
                            LabelEn = wishlist.Name["en"],
                            LabelEs = wishlist.Name["es"],
                            LabelDe = wishlist.Name["de"],
                            Count = categorie.Count,
                            Priority = categorie.Priority,
                            ZoneXpa = categorie.ZoneXPa
                        });
                    }
                }
            }
            var modelsFromDb = DbContext.DefaultWishlistItems
                .ToList();
            var defaultWishlistItemComparer = EqualityComparerFactory.Create<DefaultWishlistItem>(dwi => HashCode.Combine(dwi.IdDefaultWishlist, dwi.IdItem),
                (a, b) => a.IdDefaultWishlist == b.IdDefaultWishlist
                && a.IdItem == b.IdItem);
            DbContext.Patch(modelsFromDb, modeles, defaultWishlistItemComparer);
        }

        #endregion
    }
}
