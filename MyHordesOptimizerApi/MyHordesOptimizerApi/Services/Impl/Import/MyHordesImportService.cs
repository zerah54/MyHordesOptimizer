using AutoMapper;
using Common.Core.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Extensions.Models;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Import;
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

        // Clés d'avancement propres à l'import des villes, que le front traduit en libellé
        public const string TownsImportStep = "towns";
        public const string UserStatsImportStep = "user-stats";


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


        // Les clés d'étape sont celles utilisées par le front pour les imports individuels : elles lui
        // permettent d'afficher le libellé déjà traduit de l'étape en cours.
        public async Task ImportAllAsync(Action<ImportStepProgress> onStep = null)
        {
            var steps = new List<(string Key, Func<Task> Run)>
            {
                ("jobs", ImportJobsAsync),
                ("hero-skills", ImportHeroSkill),
                ("categories", ImportCategoriesAsync),
                ("items", ImportItemsAsync),
                ("causes-of-death", ImportCauseOfDeath),
                ("cleanup-types", () => { ImportCleanUpTypes(); return Task.CompletedTask; }),
                ("buildings", ImportBuildingAsync),
                ("ruins", () => { ImportRuins(); return Task.CompletedTask; }),
                ("pictos", () => { ImportPictos(); return Task.CompletedTask; }),
                ("wishlist-categories", () => { ImportWishlistCategorie(); return Task.CompletedTask; }),
                ("default-wishlists", () => { ImportDefaultWishlists(); return Task.CompletedTask; })
            };

            for (var i = 0; i < steps.Count; i++)
            {
                var (key, run) = steps[i];
                onStep?.Invoke(new ImportStepProgress(key, i + 1, steps.Count));
                await run();
                DbContext.ChangeTracker.Clear();
            }
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

            DbContext.Database.ExecuteSqlRaw("DELETE FROM ItemProperty");
            DbContext.Database.ExecuteSqlRaw("DELETE FROM BuildingRessources");
            DbContext.Database.ExecuteSqlRaw("DELETE FROM RecipeItemComponent");
            DbContext.Database.ExecuteSqlRaw("DELETE FROM ItemAction");
            DbContext.Database.ExecuteSqlRaw("DELETE FROM RecipeItemResult");
            DbContext.Database.ExecuteSqlRaw("DELETE FROM RuinItemDrop");

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

            var itemByProperty = new Dictionary<string, List<Item>>();
            foreach (var kvp in codeItemsProperty)
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
            var updatedProperties = itemByProperty.Select(kvp => new Property() { Name = kvp.Key, IdItems = kvp.Value }).ToList();
            var propertyComparer = EqualityComparerFactory.Create<Property>(prop => prop.Name.GetHashCode(), (a, b) => a.Name == b.Name);
            DbContext.Patch(propertiesFromDb, updatedProperties, propertyComparer);

            // Récupération des actions
            var codeItemsActions = MyHordesCodeRepository.GetItemsActions();

            var itemByAction = new Dictionary<string, List<Item>>();
            foreach (var kvp in codeItemsActions)
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
            var updatedActions = itemByAction.Select(kvp => new Action() { Name = kvp.Key, IdItems = kvp.Value }).ToList();
            var actionComparer = EqualityComparerFactory.Create<Action>(action => action.Name.GetHashCode(), (a, b) => a.Name == b.Name);
            DbContext.Patch(actionsFromDb, updatedActions, actionComparer);

            //Récupération des recipes
            var codeItemRecipes = MyHordesCodeRepository.GetRecipes();
            var mhoRecipes = Mapper.Map<List<Recipe>>(codeItemRecipes);

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

            foreach (var recipe in mhoRecipes)
            {
                var source = codeItemRecipes.FirstOrDefault(kvp => kvp.Key == recipe.Name);
                recipe.ProvokingItemId = existingItems.SingleOrDefault(i => i.Uid == source.Value?.Provoking)?.IdItem;
            }


            DbContext.Patch(recipesFromDb, mhoRecipes, recipeComparer);

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

        /// <summary>
        /// Référentiel complet des pictos (/json/pictos). Les pictos sont aussi créés à la volée
        /// depuis les récompenses des joueurs, mais celles-ci ne portent pas `community` : cet
        /// import est la seule source de ce flag, et le seul à connaître les pictos que personne
        /// n'a encore gagnés.
        /// </summary>
        public void ImportPictos()
        {
            var pictosFromMyHordes = MyHordesApiRepository.GetPictos();
            if (pictosFromMyHordes == null || pictosFromMyHordes.Count == 0)
            {
                return;
            }

            // Pas de Patch ici : il supprime les lignes absentes de la source, or Picto est référencé
            // par UserPicto et TownCitizenPicto. Un picto retiré du jeu mais encore compté chez un
            // joueur ferait échouer l'import sur sa contrainte de clé étrangère.
            var pictosFromDb = DbContext.Pictos.ToList();
            foreach (var picto in pictosFromMyHordes.Values)
            {
                var existingPicto = pictosFromDb.FirstOrDefault(fromDb => fromDb.IdPicto == picto.Id);
                if (existingPicto == null)
                {
                    DbContext.Pictos.Add(new Picto()
                    {
                        IdPicto = picto.Id,
                        Img = MyHordesExtensions.RemoveImageFingerprint(picto.Img) ?? string.Empty,
                        NameFr = GetLabel(picto.Name, "fr"),
                        NameEn = GetLabel(picto.Name, "en"),
                        NameEs = GetLabel(picto.Name, "es"),
                        NameDe = GetLabel(picto.Name, "de"),
                        DescFr = GetLabel(picto.Desc, "fr"),
                        DescEn = GetLabel(picto.Desc, "en"),
                        DescEs = GetLabel(picto.Desc, "es"),
                        DescDe = GetLabel(picto.Desc, "de"),
                        Community = picto.Community,
                        Rare = picto.Rare
                    });
                }
                else
                {
                    existingPicto.Img = MyHordesExtensions.RemoveImageFingerprint(picto.Img) ?? existingPicto.Img;
                    existingPicto.NameFr = GetLabel(picto.Name, "fr") ?? existingPicto.NameFr;
                    existingPicto.NameEn = GetLabel(picto.Name, "en") ?? existingPicto.NameEn;
                    existingPicto.NameEs = GetLabel(picto.Name, "es") ?? existingPicto.NameEs;
                    existingPicto.NameDe = GetLabel(picto.Name, "de") ?? existingPicto.NameDe;
                    existingPicto.DescFr = GetLabel(picto.Desc, "fr") ?? existingPicto.DescFr;
                    existingPicto.DescEn = GetLabel(picto.Desc, "en") ?? existingPicto.DescEn;
                    existingPicto.DescEs = GetLabel(picto.Desc, "es") ?? existingPicto.DescEs;
                    existingPicto.DescDe = GetLabel(picto.Desc, "de") ?? existingPicto.DescDe;
                    existingPicto.Community = picto.Community;
                    existingPicto.Rare = picto.Rare;
                    DbContext.Update(existingPicto);
                }
            }
            DbContext.SaveChanges();
            Logger.LogInformation($"{pictosFromMyHordes.Count} pictos importés");
        }

        private static string GetLabel(IDictionary<string, string> labels, string language)
        {
            return labels != null && labels.TryGetValue(language, out var label) ? label : null;
        }

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
                    if(ruinFromCode.Constructions is not null)
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

        #region Towns

        public Task ImportTownsAsync(int? season = null, Action<ImportStepProgress> onStep = null)
        {
            var allMhIds = MyHordesApiRepository.GetTownList(season);
            var importedTowns = 0;

            // Snapshot BDD pour détection de migration
            var bddQuery = DbContext.Towns.AsQueryable();
            if (season.HasValue) bddQuery = bddQuery.Where(t => t.Season == season.Value);
            var bddTownMeta = bddQuery.Select(t => new { t.IdTown, t.MapId }).ToList();
            var bddTownIdSet = bddTownMeta.Select(t => t.IdTown).ToHashSet();

            // Lignes provisoires (IdTown = -mapId, pas encore migrées vers leur townId stable).
            // Un townId réel étant toujours positif, bddTownIdSet (Cas 1) ne peut structurellement
            // jamais contenir une ligne provisoire par erreur. Inclut les lignes sans saison connue
            // même quand on filtre par saison, mais exclut celles d'une AUTRE saison déjà connue :
            // un mapId peut être recyclé d'une saison à l'autre, et une ligne provisoire d'une saison
            // passée ne doit jamais être migrée par erreur vers une ville différente qui réutilise le même mapId.
            var unmigratedTowns = DbContext.Towns
                .Where(t => t.IdTown < 0)
                .Select(t => new { t.IdTown, t.Season })
                .ToList();
            var bddTownIdsWithoutMapId = unmigratedTowns
                .Where(t => !t.Season.HasValue || !season.HasValue || t.Season.Value == season.Value)
                .Select(t => t.IdTown)
                .ToHashSet();

            // Les villes terminées ne sont PAS exclues : l'import (groupé ou par ville) est
            // toujours déclenché manuellement, il doit donc pouvoir rafraîchir une ville même
            // considérée comme terminée. Le coût reste raisonnable (/json/towns batché par 50,
            // aucun appel /json/map par ville dans ce chemin).
            foreach (var batch in allMhIds.Chunk(50))
            {
                var towns = MyHordesApiRepository.GetTownDetails(batch.ToList());
                foreach (var townDto in towns)
                {
                    var provisionalId = townDto.MapId.HasValue ? -townDto.MapId.Value : (int?)null;
                    if (bddTownIdSet.Contains(townDto.Id))
                    {
                        // Cas 1 : IdTown correct en BDD → mise à jour classique
                        UpsertTown(townDto);
                    }
                    else if (provisionalId.HasValue && bddTownIdsWithoutMapId.Contains(provisionalId.Value))
                    {
                        // Cas 2 : ligne provisoire (IdTown = -mapId, saison compatible) → migration
                        Logger.LogInformation(
                            "ImportTowns: migration IdTown {OldId} → {NewId} (mapId={MapId})",
                            provisionalId.Value, townDto.Id, townDto.MapId.Value);
                        MigrateTownId(provisionalId.Value, townDto);
                        bddTownIdSet.Remove(provisionalId.Value);
                        bddTownIdsWithoutMapId.Remove(provisionalId.Value);
                        bddTownIdSet.Add(townDto.Id);
                    }
                    else
                    {
                        // Cas 3 : nouvelle ville
                        UpsertTown(townDto);
                        bddTownIdSet.Add(townDto.Id);
                    }
                }
                DbContext.SaveChanges();
                DbContext.ChangeTracker.Clear();
                importedTowns += batch.Length;
                onStep?.Invoke(new ImportStepProgress(TownsImportStep, importedTowns, allMhIds.Count));
            }

            // L'import vient de créer des joueurs et des participations : l'annuaire lit des colonnes
            // dénormalisées, qui seraient sinon périmées jusqu'au prochain recalcul manuel.
            onStep?.Invoke(new ImportStepProgress(UserStatsImportStep, 1, 1));
            return RecomputeUserDirectoryStatsAsync();
        }

        // Recalcule les statistiques dénormalisées servant la liste des citoyens. En SQL brut : EF ne
        // sait pas faire d'UPDATE ... JOIN, et un aller-retour par joueur serait intenable.
        // Idempotent, donc rejouable à volonté.
        public Task RecomputeUserDirectoryStatsAsync()
        {
            // lastTownId ignore les villes provisoires (idTown = -mapId, pas encore migrées vers leur
            // identifiant stable) : leur id négatif les ferait passer pour les plus anciennes alors
            // qu'elles sont justement les plus récentes. Elles restent comptées dans nbTownsPlayed.
            var affected = DbContext.Database.ExecuteSqlRaw(@"
                UPDATE Users u
                LEFT JOIN (
                    SELECT idUser,
                           COUNT(*) AS nbTowns,
                           MAX(CASE WHEN idTown > 0 THEN idTown END) AS lastTownId
                    FROM TownCitizen
                    GROUP BY idUser
                ) tc ON tc.idUser = u.idUser
                LEFT JOIN (
                    SELECT idUser, MAX(survivalDay) AS bestSurvival
                    FROM TownCadaver
                    GROUP BY idUser
                ) cad ON cad.idUser = u.idUser
                SET u.nbTownsPlayed = COALESCE(tc.nbTowns, 0),
                    u.lastTownId    = tc.lastTownId,
                    u.bestSurvival  = cad.bestSurvival");

            Logger.LogInformation("RecomputeUserDirectoryStats: {Affected} joueurs mis à jour", affected);
            return Task.CompletedTask;
        }

        // Rafraîchit les pseudos depuis /json/users, seule source faisant autorité : les chemins
        // « cadavre » (/json/towns, cadavres de /json/map) renvoient `getAlias() ?? getName()` et ne
        // peuvent donc pas écrire Users.name. Coût proportionnel au nombre de joueurs DISTINCTS et
        // non au nombre de villes : un joueur vu dans 50 villes ne coûte qu'une entrée de batch.
        public Task RefreshUserNamesAsync(int? limit = null)
        {
            // Jamais rafraîchis d'abord (pseudo potentiellement aliasé), puis les plus anciens
            var idsQuery = DbContext.Users
                .OrderBy(user => user.NameRefreshedAt.HasValue)
                .ThenBy(user => user.NameRefreshedAt)
                .Select(user => user.IdUser);
            if (limit.HasValue)
            {
                idsQuery = idsQuery.Take(limit.Value);
            }
            var ids = idsQuery.ToList();
            DbContext.ChangeTracker.Clear();

            var refreshed = 0;
            foreach (var batch in ids.Chunk(100))
            {
                var batchIds = batch.ToList();
                var identities = MyHordesApiRepository.GetUsersIdentity(batchIds);
                // getUsersAPI renvoie une entrée d'erreur (sans id) pour un joueur inconnu
                var identityByUserId = identities
                    .Where(identity => identity.Id > 0)
                    .ToDictionary(identity => identity.Id);

                var users = DbContext.Users.Where(user => batchIds.Contains(user.IdUser)).ToList();
                var now = DateTime.UtcNow;
                foreach (var user in users)
                {
                    // Marqué même sans réponse (compte supprimé côté MyHordes) : sinon le joueur
                    // resterait en tête de file à chaque passe et bloquerait les suivants.
                    user.NameRefreshedAt = now;
                    if (!identityByUserId.TryGetValue(user.IdUser, out var identity))
                    {
                        continue;
                    }
                    if (!string.IsNullOrEmpty(identity.Name))
                    {
                        user.Name = identity.Name;
                    }
                    if (!string.IsNullOrEmpty(identity.Avatar))
                    {
                        user.Avatar = identity.Avatar;
                    }
                    refreshed++;
                }
                DbContext.SaveChanges();
                DbContext.ChangeTracker.Clear();
            }

            Logger.LogInformation("RefreshUserNames: {Refreshed}/{Total} joueurs rafraîchis", refreshed, ids.Count);
            return Task.CompletedTask;
        }

        private void MigrateTownId(int oldIdTown, MyHordesTownDetailsDto dto)
        {
            // Flush les changements EF en attente avant de passer en SQL brut
            DbContext.SaveChanges();
            DbContext.ChangeTracker.Clear();

            using var transaction = DbContext.Database.BeginTransaction();
            DbContext.Database.ExecuteSqlRaw("SET FOREIGN_KEY_CHECKS = 0");

            // Mise à jour de toutes les tables ayant une FK directe sur Town.idTown
            DbContext.Database.ExecuteSqlRaw("UPDATE TownEstimation SET idTown = {0} WHERE idTown = {1}", dto.Id, oldIdTown);
            DbContext.Database.ExecuteSqlRaw("UPDATE TownWishListItem SET idTown = {0} WHERE idTown = {1}", dto.Id, oldIdTown);
            DbContext.Database.ExecuteSqlRaw("UPDATE TownBankItem SET idTown = {0} WHERE idTown = {1}", dto.Id, oldIdTown);
            DbContext.Database.ExecuteSqlRaw("UPDATE TownCitizenBath SET idTown = {0} WHERE idTown = {1}", dto.Id, oldIdTown);
            DbContext.Database.ExecuteSqlRaw("UPDATE TownCadaver SET idTown = {0} WHERE idTown = {1}", dto.Id, oldIdTown);
            DbContext.Database.ExecuteSqlRaw("UPDATE TownCitizen SET idTown = {0} WHERE idTown = {1}", dto.Id, oldIdTown);
            DbContext.Database.ExecuteSqlRaw("UPDATE MapCellDigUpdate SET idTown = {0} WHERE idTown = {1}", dto.Id, oldIdTown);
            DbContext.Database.ExecuteSqlRaw("UPDATE MapCell SET idTown = {0} WHERE idTown = {1}", dto.Id, oldIdTown);
            DbContext.Database.ExecuteSqlRaw("UPDATE Expedition SET idTown = {0} WHERE idTown = {1}", dto.Id, oldIdTown);
            // La Town elle-même en dernier
            DbContext.Database.ExecuteSqlRaw(
                "UPDATE Town SET idTown = {0}, mapId = {1} WHERE idTown = {2}",
                dto.Id, dto.MapId!.Value, oldIdTown);

            DbContext.Database.ExecuteSqlRaw("SET FOREIGN_KEY_CHECKS = 1");
            transaction.Commit();

            // Mise à jour des champs métier via UpsertTown (commit par le SaveChanges du batch)
            DbContext.ChangeTracker.Clear();
            UpsertTown(dto);
        }

        public Task ImportSingleTownAsync(int townId)
        {
            if (townId < 0)
            {
                // Ligne provisoire (IdTown = -mapId) : son townId naturel est inconnu — la ville n'est
                // pas forcément listée par /json/townlist pour sa saison, donc /json/towns (qui n'accepte
                // que des townId réels) ne peut pas être utilisé ici sous peine de retomber par coïncidence
                // sur une tout autre ville portant ce même nombre comme townId. Seul /json/map (qui
                // accepte le mapId directement) permet d'enrichir la ligne en place, sans migration.
                return EnrichProvisionalTownAsync(townId, -townId);
            }

            var queryId = townId;
            var towns = MyHordesApiRepository.GetTownDetails(new List<int> { queryId });
            var townDto = towns.FirstOrDefault();
            if (townDto != null)
            {
                Logger.LogInformation("ImportSingleTown {TownId}: /json/towns returned data (language={Language}, season={Season}, phase={Phase}, mapId={MapId})",
                    queryId, townDto.Language, townDto.Season, townDto.Phase, townDto.MapId);

                // Migration : l'appelant a envoyé le mapId au lieu du naturalId.
                if (townDto.Id != queryId && townDto.MapId.HasValue && townDto.MapId.Value == queryId)
                {
                    var provisionalId = -queryId;
                    var oldRecord = DbContext.Towns.Find(provisionalId);
                    // Vérification de saison : un mapId peut être recyclé d'une saison à l'autre, on ne
                    // migre que si la ligne trouvée est bien la même ville (saison inconnue ou compatible).
                    var seasonMatches = oldRecord != null
                        && (!oldRecord.Season.HasValue || !townDto.Season.HasValue || oldRecord.Season.Value == townDto.Season.Value);
                    if (oldRecord != null && seasonMatches)
                    {
                        Logger.LogInformation("ImportSingleTown: migration détectée, IdTown {OldId} → {NewId}", provisionalId, townDto.Id);
                        MigrateTownId(provisionalId, townDto);
                    }
                    else
                    {
                        UpsertTown(townDto);
                    }
                }
                else
                {
                    UpsertTown(townDto);
                }
                DbContext.SaveChanges();
                DbContext.ChangeTracker.Clear();
            }
            else
            {
                Logger.LogWarning("ImportSingleTown {TownId}: /json/towns returned no data", queryId);
            }

            var effectiveTownId = townDto?.Id ?? townId;
            var townInDb = DbContext.Towns.Find(effectiveTownId);
            var mapId = townInDb?.MapId ?? queryId;
            Logger.LogInformation("ImportSingleTown {TownId}: appel /json/map avec mapId={MapId} (source: {Source})",
                townId, mapId, townInDb?.MapId != null ? "base" : "fallback=townId");

            try
            {
                var mapDetails = MyHordesApiRepository.GetMapDetails(mapId);
                EnrichTownFromMap(effectiveTownId, mapDetails);
                DbContext.SaveChanges();
                DbContext.ChangeTracker.Clear();
            }
            catch (MyHordesApiException ex) when (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                throw;
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Impossible de récupérer les détails de la carte pour la ville {TownId} (mapId={MapId})", townId, mapId);
            }

            return Task.CompletedTask;
        }

        private Task EnrichProvisionalTownAsync(int townId, int mapId)
        {
            Logger.LogInformation("ImportSingleTown {TownId}: ville provisoire, appel /json/map avec mapId={MapId}", townId, mapId);
            try
            {
                var mapDetails = MyHordesApiRepository.GetMapDetails(mapId);
                EnrichTownFromMap(townId, mapDetails);
                DbContext.SaveChanges();
                DbContext.ChangeTracker.Clear();
            }
            catch (MyHordesApiException ex) when (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                throw;
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Impossible de récupérer les détails de la carte pour la ville provisoire {TownId} (mapId={MapId})", townId, mapId);
            }

            return Task.CompletedTask;
        }

        private void UpsertTown(MyHordesTownDetailsDto dto)
        {
            var townId = dto.Id;
            var isNew = false;
            var existing = DbContext.Towns.Find(townId);
            if (existing == null)
            {
                existing = new Town { IdTown = townId };
                isNew = true;
            }

            if (dto.MapId.HasValue) existing.MapId = dto.MapId.Value;
            if (dto.Name != null) existing.Name = dto.Name;
            if (dto.Day.HasValue) existing.Day = dto.Day.Value;
            if (dto.Language != null) existing.Language = dto.Language;
            if (dto.Score.HasValue) existing.Score = dto.Score;
            if (dto.Season.HasValue) existing.Season = dto.Season;

            var phase = TownExtensions.MapTownPhase(dto.Phase);
            if (phase != null)
            {
                existing.PhaseId = (int)phase;
            }

            // IsFinished n'est PAS déduit d'ici : le endpoint bulk /json/towns ne remonte souvent que
            // les citoyens déjà morts (pas les vivants), donc dto.Citizens.All(dead) est presque
            // toujours vrai dès qu'il y a eu un décès, quel que soit l'état réel de la ville. Seul
            // EnrichTownFromMap (/json/map, visibilité complète vivants+cadavres) peut le déterminer
            // de façon fiable.

            if (dto.Wid.HasValue && dto.Wid > 0) existing.Width = dto.Wid.Value;
            if (dto.Hei.HasValue && dto.Hei > 0) existing.Height = dto.Hei.Value;
            if (dto.City != null && !string.IsNullOrEmpty(dto.City.Type))
            {
                existing.IsChaos = dto.City.Chaos;
                existing.IsDevasted = dto.City.Devast;
                existing.IsDoorOpen = dto.City.Door;
                existing.WaterWell = dto.City.Water;
                existing.X = dto.City.X;
                existing.Y = dto.City.Y;
                existing.TownTypeId = (int?)TownExtensions.MapTownType(dto.City.Type);
            }

            if (isNew)
            {
                DbContext.Towns.Add(existing);
            }

            if (dto.Citizens != null)
            {
                UpsertTownCitizens(townId, dto.Citizens);
            }
        }

        private void EnrichTownFromMap(int townId, MyHordesMap map)
        {
            var existing = DbContext.Towns.Find(townId);
            if (existing == null) return;

            Logger.LogInformation("EnrichTownFromMap {TownId}: season={Season}, phase={Phase}, wid={Wid}, hei={Hei}, cityType={CityType}, citizens={Citizens}, cadavers={Cadavers}",
                townId, map.Season, map.Phase, map.Wid, map.Hei, map.City?.Type,
                map.Citizens?.Count ?? 0, map.Cadavers?.Count ?? 0);

            // Mise à jour centralisée, partagée avec le fetcher et les outils externes
            existing.UpdateFromMapDetails(map);

            if (map.Citizens != null && map.Cadavers != null)
            {
                // /json/map donne une visibilité complète (vivants + cadavres), contrairement au bulk
                // /json/towns : seule source fiable pour déterminer si une ville est réellement terminée
                // (plus aucun citoyen vivant, mais au moins un mort).
                existing.IsFinished = map.Citizens.Count == 0 && map.Cadavers.Count > 0;
            }

            UpsertTownCitizensFromMap(townId, map);
        }

        private void UpsertTownCitizensFromMap(int townId, MyHordesMap map)
        {
            var existingCitizens = DbContext.TownCitizens
                .Where(c => c.IdTown == townId)
                .ToList();
            var existingCadavers = DbContext.TownCadavers
                .Where(c => c.IdTown == townId)
                .ToList();
            LastUpdateInfo lastUpdate = null;

            if (map.Citizens != null)
            {
                foreach (var c in map.Citizens)
                {
                    // Citoyens vivants : getCitizensData délègue à getUserData, le nom est le vrai pseudo
                    var user = UpsertUser(c.Id, c.Name, c.Avatar as string, nameIsAuthoritative: true);
                    var citizen = GetOrCreateTownCitizen(townId, user, existingCitizens, ref lastUpdate);
                    citizen.Dead = false;
                    if (!string.IsNullOrEmpty(c.HomeMessage))
                    {
                        citizen.HomeMessage = c.HomeMessage;
                    }
                }
            }

            if (map.Cadavers != null)
            {
                foreach (var c in map.Cadavers)
                {
                    var user = UpsertUser(c.Id, c.Name, c.Avatar, nameIsAuthoritative: false);
                    var citizen = GetOrCreateTownCitizen(townId, user, existingCitizens, ref lastUpdate);
                    citizen.Dead = true;
                    citizen.NameInTown = c.Name;
                    var cadaver = GetOrCreateTownCadaver(townId, user, existingCadavers);
                    cadaver.SurvivalDay = c.Survival;
                    cadaver.Score = c.Score;
                    cadaver.CauseOfDeath = c.Dtype;
                    cadaver.DeathMessage = c.Msg;
                    cadaver.TownMessage = c.Comment;
                }
            }
        }

        private void UpsertTownCitizens(int townId, List<MyHordesTownCitizenDto> citizens)
        {
            var existingCitizens = DbContext.TownCitizens
                .Where(c => c.IdTown == townId)
                .ToList();
            var existingCadavers = DbContext.TownCadavers
                .Where(c => c.IdTown == townId)
                .ToList();
            LastUpdateInfo lastUpdate = null;

            foreach (var citizenDto in citizens)
            {
                // /json/towns passe par getCadaversInformation : le nom peut être un alias
                var user = UpsertUser(citizenDto.Id, citizenDto.Name, citizenDto.Avatar, nameIsAuthoritative: false);
                var citizen = GetOrCreateTownCitizen(townId, user, existingCitizens, ref lastUpdate);
                citizen.NameInTown = citizenDto.Name;
                var isDead = citizenDto.Dtype.HasValue && citizenDto.Dtype.Value > 0;
                citizen.Dead = isDead;
                if (isDead)
                {
                    var cadaver = GetOrCreateTownCadaver(townId, user, existingCadavers);
                    cadaver.SurvivalDay = citizenDto.Survival;
                    cadaver.Score = citizenDto.Score;
                    cadaver.CauseOfDeath = citizenDto.Dtype;
                    cadaver.DeathMessage = citizenDto.Msg;
                    cadaver.TownMessage = citizenDto.Comment;
                }
            }
        }

        /// <param name="nameIsAuthoritative">
        /// Faux quand `name` vient d'un chemin « cadavre » (`getCadaversInformation` : /json/towns
        /// citizens, /json/map cadavers), qui renvoie `getAlias() ?? getUser()->getName()` : dans une
        /// ville à alias, ce nom est un nom d'emprunt et écraserait le pseudo réel partout, puisque
        /// name ne vit que sur User. Le nom brut est conservé sur TownCitizen.NameInTown ; seul un
        /// chemin `getUserData` (/json/me, /json/map citizens) fait autorité sur le pseudo.
        /// L'avatar, lui, est toujours celui du User : il est fiable sur tous les chemins.
        /// </param>
        private User UpsertUser(int userId, string name, string avatar, bool nameIsAuthoritative)
        {
            // Le tracker d'abord : le même joueur peut apparaître dans plusieurs villes
            // d'un même batch, avant le SaveChanges
            var user = DbContext.Users.Local.FirstOrDefault(u => u.IdUser == userId)
                ?? DbContext.Users.FirstOrDefault(u => u.IdUser == userId);
            if (user == null)
            {
                // À la création on n'a que ce nom, potentiellement un alias : un refresh ultérieur
                // via /json/users le corrigera. Mieux vaut un nom approximatif que vide.
                user = new User { IdUser = userId, Name = name ?? string.Empty, Avatar = avatar };
                DbContext.Users.Add(user);
            }
            else
            {
                if (nameIsAuthoritative && !string.IsNullOrEmpty(name))
                {
                    user.Name = name;
                }
                if (!string.IsNullOrEmpty(avatar))
                {
                    user.Avatar = avatar;
                }
            }
            return user;
        }

        private TownCitizen GetOrCreateTownCitizen(int townId, User user, List<TownCitizen> existingCitizens, ref LastUpdateInfo lastUpdate)
        {
            var citizen = existingCitizens.FirstOrDefault(c => c.IdUser == user.IdUser);
            if (citizen == null)
            {
                if (lastUpdate == null)
                {
                    // LastUpdateInfo « système » (idUser null) : l'import n'est pas rattaché à un utilisateur
                    lastUpdate = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
                    DbContext.LastUpdateInfos.Add(lastUpdate);
                }
                citizen = new TownCitizen
                {
                    IdTown = townId,
                    IdUser = user.IdUser,
                    IdUserNavigation = user,
                    IdLastUpdateInfoNavigation = lastUpdate
                };
                DbContext.TownCitizens.Add(citizen);
                existingCitizens.Add(citizen);
            }
            return citizen;
        }

        private TownCadaver GetOrCreateTownCadaver(int townId, User user, List<TownCadaver> existingCadavers)
        {
            var cadaver = existingCadavers.FirstOrDefault(c => c.IdUser == user.IdUser);
            if (cadaver == null)
            {
                cadaver = new TownCadaver
                {
                    IdTown = townId,
                    IdUser = user.IdUser,
                    IdUserNavigation = user
                };
                DbContext.TownCadavers.Add(cadaver);
                existingCadavers.Add(cadaver);
            }
            return cadaver;
        }

        #endregion

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
