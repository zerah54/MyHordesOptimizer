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
using MyHordesOptimizerApi.Models.Translation;
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
                capacitie.LabelFr = Traduire(translations, "fr", capacitie.LabelDe);
                capacitie.LabelEn = Traduire(translations, "en", capacitie.LabelDe);
                capacitie.LabelEs = Traduire(translations, "es", capacitie.LabelDe);
                capacitie.DescriptionFr = Traduire(translations, "fr", capacitie.DescriptionDe);
                capacitie.DescriptionEn = Traduire(translations, "en", capacitie.DescriptionDe);
                capacitie.DescriptionEs = Traduire(translations, "es", capacitie.DescriptionDe);
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

                causeOfDeath.LabelFr = Traduire(translations, "fr", causeOfDeath.LabelDe);
                causeOfDeath.LabelEn = Traduire(translations, "en", causeOfDeath.LabelDe);
                causeOfDeath.LabelEs = Traduire(translations, "es", causeOfDeath.LabelDe);
                causeOfDeath.DescriptionFr = Traduire(translations, "fr", causeOfDeath.DescriptionDe);
                causeOfDeath.DescriptionEn = Traduire(translations, "en", causeOfDeath.DescriptionDe);
                causeOfDeath.DescriptionEs = Traduire(translations, "es", causeOfDeath.DescriptionDe);
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

            // IdItem est la clé primaire du référentiel. Sans ce filtre, un objet dont MyHordes
            // n'aurait pas transmis l'id verrait AutoMapper convertir le null en 0 sans rien
            // signaler, et tous les objets concernés s'effondreraient sur la même ligne.
            var mhoItems = Mapper.Map<List<Item>>(
                myHordesItems.Where(entry => entry.Value.Id.HasValue).ToList());
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

            // Rapprochement sur le UID, jamais sur l'identifiant de MyHordes : celui-ci est un
            // auto-incrément de fixtures, qui change d'une instance du jeu à l'autre. Les objets
            // n'avaient pas encore divergé (383 sur 383 alignés le 2026-07-27), mais rien ne
            // garantissait qu'ils ne divergeraient pas — et un objet est référencé par la banque,
            // les sacs, les listes de courses et la carte.
            //
            // Plus aucune suppression : un objet retiré du jeu est marqué obsolète et sa ligne
            // conservée, sans quoi tout l'historique qui le référence tomberait avec lui.
            var modelesParUid = mhoItems
                .Where(item => !string.IsNullOrEmpty(item.Uid))
                .ToDictionary(item => item.Uid!, StringComparer.Ordinal);
            var existingItems = DbContext.Items.ToList();
            var sourceItems = myHordesItems
                .Where(entry => entry.Value.Id.HasValue)
                .Select(entry => (Uid: entry.Key, MhId: entry.Value.Id!.Value))
                .ToList();
            var rapprochementItems = ReferentialReconciler.Reconcile(existingItems, sourceItems, item => item.Uid);

            foreach (var (existant, nouveauMhId) in rapprochementItems.AMettreAJour)
            {
                var modele = modelesParUid[existant.Uid!];
                existant.UpdateAllButKeysProperties(modele);
                existant.MhId = nouveauMhId;
                existant.IsObsolete = false;
                DbContext.Update(existant);
            }

            // La clé d'un objet nouveau est attribuée par MHO. Ne JAMAIS reprendre mhId : ce serait
            // exactement l'erreur que ce découplage corrige.
            var prochaineCleItem = existingItems.Count == 0 ? 1 : existingItems.Max(item => item.IdItem) + 1;
            foreach (var (uid, mhId) in rapprochementItems.ACreer)
            {
                var modele = modelesParUid[uid];
                modele.IdItem = prochaineCleItem++;
                modele.MhId = mhId;
                DbContext.Items.Add(modele);
                Logger.LogInformation("ImportItems : nouvel objet « {Uid} » (mhId {MhId}) créé sous la clé {Cle}.",
                    uid, mhId, modele.IdItem);
            }

            foreach (var disparu in rapprochementItems.ARendreObsoletes)
            {
                disparu.IsObsolete = true;
                DbContext.Update(disparu);
                Logger.LogInformation("ImportItems : « {Uid} » n'existe plus chez MyHordes, marqué obsolète.",
                    disparu.Uid);
            }

            foreach (var sansIdentite in rapprochementItems.SansIdentite)
            {
                Logger.LogWarning("ImportItems : objet {Cle} sans uid, non rapprochable — laissé en l'état.",
                    sansIdentite.IdItem);
            }

            DbContext.SaveChanges();
            // Rechargé depuis la BASE : c'est de là que viennent les clés que les tables de liaison
            // (propriétés, actions, recettes) doivent référencer. Les modèles transitoires, eux,
            // n'ont plus de clé — le mapping ne l'attribue plus.
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
                    recipe.ActionFr = Traduire(translations, "fr", recipe.ActionDe);
                    recipe.ActionEn = Traduire(translations, "en", recipe.ActionDe);
                    recipe.ActionEs = Traduire(translations, "es", recipe.ActionDe);
                }
            }
            var recipesFromDb = DbContext.Recipes.ToList();
            var recipeComparer = EqualityComparerFactory.Create<Recipe>(recipe => recipe.Name.GetHashCode(), (a, b) => a.Name == b.Name);

            foreach (var recipe in mhoRecipes)
            {
                var source = codeItemRecipes.FirstOrDefault(kvp => kvp.Key == recipe.Name);
                var uidProvoquant = source.Value?.Provoking;
                // Sans la garde, un `Provoking` absent ferait chercher un objet d'uid null : la
                // recette hériterait alors du premier objet sans uid au lieu de n'en avoir aucun.
                var provoquant = string.IsNullOrEmpty(uidProvoquant)
                    ? null
                    : existingItems.SingleOrDefault(item => item.Uid == uidProvoquant);
                recipe.ProvokingItemId = provoquant?.IdItem;
                // La NAVIGATION doit être renseignée en même temps que la clé étrangère. `Patch`
                // recopie l'une et l'autre sur l'entité suivie ; si la navigation vaut null alors
                // qu'EF l'avait résolue au chargement, il en conclut que la relation est rompue et
                // remet la clé étrangère à null — écrasant celle qu'on vient d'affecter. Cela
                // faisait osciller `provoking` d'un import à l'autre : renseigné, vide, renseigné.
                recipe.ProvokingItemNavigation = provoquant;
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
                    // Les clés se lisent sur `existingItems`, rechargé depuis la base, et non sur
                    // les modèles issus du mapping : ceux-ci ne portent plus de clé, MHO l'attribue
                    // au rapprochement. Les y chercher donnerait 0 sur chaque résultat de recette.
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
                                IdItem = existingItems.Where(i => i.Uid == uid).Select(i => i.IdItem).First(),
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
                                IdItem = existingItems.Where(i => i.Uid == uid).Select(i => i.IdItem).First(),
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

            var buildingModels = Mapper.Map<List<Building>>(
                buildingsDto.Where(entry => entry.Value.Id.HasValue).ToList());

            foreach (var buildingCode in buildingCodes)
            {
                var buildingModel = buildingModels.FirstOrDefault(building => building.Uid == buildingCode.Key);
                if (buildingModel != null)
                {
                    buildingModel.WatchSurvivalBonusUpgradeLevelRequired = buildingCode.Value.WatchSurvivalBonusUpgradeLevelRequired;
                }
            }
            var modelesParUid = buildingModels
                .Where(building => !string.IsNullOrEmpty(building.Uid))
                .ToDictionary(building => building.Uid!, StringComparer.Ordinal);

            var buildingFromDb = DbContext.Buildings
            .Include(building => building.BuildingRessources)
            .ToList();

            // Rapprochement sur le UID, jamais sur l'identifiant de MyHordes : celui-ci est un
            // auto-incrément de fixtures, qui change d'une instance du jeu à l'autre. Mesuré le
            // 2026-07-27 : 128 des 166 bâtiments avaient déjà divergé.
            //
            // Plus aucune suppression : un prototype retiré du jeu est marqué obsolète et sa ligne
            // conservée. C'est ce qui fait disparaître la violation de clé étrangère sur
            // BuildingWatchSurvivalBonusJobs, qui n'existait que parce qu'on supprimait.
            var source = buildingsDto
                .Where(entry => entry.Value.Id.HasValue)
                .Select(entry => (Uid: entry.Key, MhId: entry.Value.Id!.Value))
                .ToList();
            var rapprochement = ReferentialReconciler.Reconcile(
                buildingFromDb, source, building => building.Uid,
                estPropreAMho: building => building.IdBuilding < 0);

            // Les ressources d'un chantier désignent les objets par leur identifiant MyHordes. Il
            // faut le traduire en clé MHO : les deux coïncident aujourd'hui, mais c'est précisément
            // la coïncidence que ce chantier cesse de supposer.
            var clesItemParMhId = DbContext.Items
                .Where(item => item.MhId != null)
                .ToDictionary(item => item.MhId!.Value, item => item.IdItem);

            var batimentsTraites = new List<Building>();
            foreach (var (existant, nouveauMhId) in rapprochement.AMettreAJour)
            {
                var modele = modelesParUid[existant.Uid!];
                existant.UpdateAllButKeysProperties(modele);
                existant.MhId = nouveauMhId;
                existant.IsObsolete = false;
                PropagerCleAuxRessources(existant, clesItemParMhId);
                // PAS de DbContext.Update ici : il déclenche la détection de changements, or la
                // navigation vers le parent vient d'être recopiée à null par
                // UpdateAllButKeysProperties. EF en conclurait que la relation est rompue et
                // mettrait idBuildingParent à null AVANT que la traduction plus bas ne le lise.
                // L'enregistrement se fait donc après, en un seul passage.
                batimentsTraites.Add(existant);
            }

            // La clé d'un bâtiment nouveau est attribuée par MHO. Ne JAMAIS reprendre mhId : ce
            // serait exactement l'erreur que ce découplage corrige.
            var prochaineCle = buildingFromDb.Count == 0 ? 1 : buildingFromDb.Max(building => building.IdBuilding) + 1;
            foreach (var (uid, mhId) in rapprochement.ACreer)
            {
                var modele = modelesParUid[uid];
                modele.IdBuilding = prochaineCle++;
                modele.MhId = mhId;
                PropagerCleAuxRessources(modele, clesItemParMhId);
                DbContext.Buildings.Add(modele);
                batimentsTraites.Add(modele);
                Logger.LogInformation("ImportBuilding : nouveau bâtiment « {Uid} » (mhId {MhId}) créé sous la clé {Cle}.",
                    uid, mhId, modele.IdBuilding);
            }

            // Le parent d'un chantier est lui aussi désigné par un identifiant MyHordes. La
            // traduction vient après les deux boucles : un parent peut être un bâtiment créé à
            // l'instant, dont la clé n'existait pas avant.
            //
            // La NAVIGATION est renseignée en même temps que la clé étrangère, et jamais laissée à
            // null : le mapping l'ignore, or EF l'avait résolue au chargement pour les lignes déjà
            // en base. La recopier à null lui ferait conclure que la relation est rompue, et il
            // remettrait `idBuildingParent` à null — la hiérarchie des chantiers s'effacerait un
            // import sur deux.
            var batimentsParMhId = batimentsTraites
                .Where(building => building.MhId.HasValue)
                .ToDictionary(building => building.MhId!.Value);
            var sansParent = 0;
            var traduits = 0;
            foreach (var batiment in batimentsTraites)
            {
                if (batiment.IdBuildingParent is not int parentMhId)
                {
                    sansParent++;
                    batiment.IdBuildingParentNavigation = null;
                    continue;
                }
                if (batimentsParMhId.TryGetValue(parentMhId, out var parent))
                {
                    traduits++;
                    batiment.IdBuildingParent = parent.IdBuilding;
                    batiment.IdBuildingParentNavigation = parent;
                }
                else
                {
                    // Un parent que MyHordes ne renvoie plus : on préfère un chantier sans parent à
                    // un chantier rattaché à une ligne au hasard.
                    Logger.LogWarning("ImportBuilding : parent {ParentMhId} introuvable pour « {Uid} », rattachement abandonné.",
                        parentMhId, batiment.Uid);
                    batiment.IdBuildingParent = null;
                    batiment.IdBuildingParentNavigation = null;
                }
            }

            // REPOSER LA COLLECTION INVERSE, sans quoi tout ce qui précède est perdu.
            // `UpdateAllButKeysProperties` recopie AUSSI les propriétés de navigation, y compris
            // `InverseIdBuildingParentNavigation` — la liste des enfants — que le modèle issu du
            // mapping a vide. Sur une entité suivie dont EF avait résolu cette collection au
            // chargement, une collection vidée se lit comme le retrait de tous les enfants : EF
            // efface alors LEUR clé étrangère, annulant la traduction qu'on vient de faire.
            //
            // Symptôme observé : la hiérarchie oscillait entre 121 et 38 enfants d'un import à
            // l'autre, alors que la traduction, elle, en calculait 159 à chaque fois.
            var tousLesBatiments = batimentsTraites.Concat(rapprochement.ARendreObsoletes).ToList();
            var enfantsParParent = tousLesBatiments
                .Where(building => building.IdBuildingParent.HasValue)
                .GroupBy(building => building.IdBuildingParent!.Value)
                .ToDictionary(groupe => groupe.Key, groupe => groupe.ToList());
            foreach (var batiment in tousLesBatiments)
            {
                batiment.InverseIdBuildingParentNavigation =
                    enfantsParParent.TryGetValue(batiment.IdBuilding, out var enfants)
                        ? enfants
                        : new List<Building>();
            }

            Logger.LogInformation("ImportBuilding : parents — traités {Traites}, sans parent {SansParent}, traduits {Traduits}",
                batimentsTraites.Count, sansParent, traduits);

            // Enregistrement APRÈS la traduction : clé étrangère et navigation sont désormais
            // cohérentes, EF n'a plus de relation à rompre. Les bâtiments créés sont déjà suivis
            // par leur Add, il n'y a que les existants à marquer.
            foreach (var (existant, _) in rapprochement.AMettreAJour)
            {
                DbContext.Update(existant);
            }

            foreach (var disparu in rapprochement.ARendreObsoletes)
            {
                disparu.IsObsolete = true;
                DbContext.Update(disparu);
                Logger.LogInformation("ImportBuilding : « {Uid} » n'existe plus chez MyHordes, marqué obsolète.",
                    disparu.Uid);
            }

            foreach (var sansIdentite in rapprochement.SansIdentite)
            {
                Logger.LogWarning("ImportBuilding : bâtiment {Cle} sans uid, non rapprochable — laissé en l'état.",
                    sansIdentite.IdBuilding);
            }

            DbContext.SaveChanges();

            var buildingWatchSurvivalJobs = new List<BuildingWatchSurvivalBonusJob>();
            // Les clés viennent désormais de la BASE et non des modèles transitoires : ce sont
            // elles que la table de liaison doit référencer.
            var clesParUid = DbContext.Buildings
                .Where(building => building.Uid != null)
                .ToDictionary(building => building.Uid!, building => building.IdBuilding, StringComparer.Ordinal);
            foreach (var buildingCode in buildingCodes)
            {
                if (!clesParUid.TryGetValue(buildingCode.Key, out var cleBatiment))
                {
                    continue;
                }
                foreach (var job in buildingCode.Value.WatchSurvivalBonusJob)
                {
                    var buildingWatchSurvivalJob = new BuildingWatchSurvivalBonusJob()
                    {
                        IdBuilding = cleBatiment,
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

        /// <summary>
        /// Reporte la clé du bâtiment sur ses ressources et traduit l'objet de chacune, désigné par
        /// son identifiant MyHordes, en clé MHO. Le profil de mapping ne peut faire ni l'un ni
        /// l'autre : la clé du bâtiment n'est connue qu'une fois la ligne rapprochée, et la
        /// traduction demande le référentiel des objets.
        /// </summary>
        /// <remarks>
        /// Une ressource dont l'objet est inconnu est écartée : la rattacher à la clé brute de
        /// MyHordes désignerait un objet au hasard dès que les deux numérotations divergeront.
        /// </remarks>
        private void PropagerCleAuxRessources(Building building, IReadOnlyDictionary<int, int> clesItemParMhId)
        {
            if (building.BuildingRessources == null)
            {
                return;
            }
            var resolues = new List<BuildingRessource>();
            foreach (var ressource in building.BuildingRessources)
            {
                if (!clesItemParMhId.TryGetValue(ressource.IdItem, out var cleItem))
                {
                    Logger.LogWarning("ImportBuilding : objet {MhId} inconnu dans les ressources de « {Uid} », ressource écartée.",
                        ressource.IdItem, building.Uid);
                    continue;
                }
                ressource.IdItem = cleItem;
                ressource.IdBuilding = building.IdBuilding;
                resolues.Add(ressource);
            }
            building.BuildingRessources = resolues;
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

            // Rapprochement sur le UID — la clé du dictionnaire de /json/pictos, c'est-à-dire le nom
            // du prototype (« r_ripflash_#00 ») — et jamais sur l'identifiant de MyHordes : celui-ci
            // est un auto-incrément de fixtures, qui change d'une instance du jeu à l'autre.
            //
            // Règle générale du référentiel : un picto retiré du jeu est marqué obsolète, jamais
            // supprimé. La ligne doit survivre, elle est référencée par UserPicto et
            // TownCitizenPicto — un picto retiré mais encore compté chez un joueur ne doit pas
            // emporter son historique.
            var pictosFromDb = DbContext.Pictos.ToList();
            var source = pictosFromMyHordes
                .Where(entry => entry.Value.Id.HasValue)
                .Select(entry => (Uid: entry.Key, MhId: entry.Value.Id!.Value))
                .ToList();

            // Adoption préalable : les pictos créés à la volée depuis les récompenses des joueurs
            // n'ont PAS de uid — ces réponses ne portent pas le nom du prototype. Ce référentiel est
            // la seule source qui l'expose : il rattache ces lignes par leur mhId avant de
            // rapprocher, sans quoi il en créerait un doublon à chaque import.
            var uidsConnus = pictosFromDb.Where(picto => picto.Uid != null)
                                         .Select(picto => picto.Uid!)
                                         .ToHashSet(StringComparer.Ordinal);
            var orphelinsParMhId = pictosFromDb
                .Where(picto => picto.Uid == null)
                .GroupBy(picto => picto.MhId ?? picto.IdPicto)
                .ToDictionary(groupe => groupe.Key, groupe => groupe.First());
            foreach (var (uid, mhId) in source)
            {
                if (!uidsConnus.Contains(uid) && orphelinsParMhId.TryGetValue(mhId, out var orphelin))
                {
                    orphelin.Uid = uid;
                    uidsConnus.Add(uid);
                    Logger.LogInformation("ImportPictos : picto {Cle} rattaché à « {Uid} » par son mhId {MhId}.",
                        orphelin.IdPicto, uid, mhId);
                }
            }

            var rapprochement = ReferentialReconciler.Reconcile(pictosFromDb, source, picto => picto.Uid);

            foreach (var (existant, nouveauMhId) in rapprochement.AMettreAJour)
            {
                var dto = pictosFromMyHordes[existant.Uid!];
                AppliquerDescription(existant, dto);
                existant.MhId = nouveauMhId;
                existant.IsObsolete = false;
                DbContext.Update(existant);
            }

            // La clé d'un picto nouveau est attribuée par MHO. Ne JAMAIS reprendre mhId : ce serait
            // exactement l'erreur que ce découplage corrige.
            var prochaineCle = pictosFromDb.Count == 0 ? 1 : pictosFromDb.Max(picto => picto.IdPicto) + 1;
            foreach (var (uid, mhId) in rapprochement.ACreer)
            {
                var nouveau = new Picto()
                {
                    IdPicto = prochaineCle++,
                    Uid = uid,
                    MhId = mhId,
                    Img = string.Empty
                };
                AppliquerDescription(nouveau, pictosFromMyHordes[uid]);
                DbContext.Pictos.Add(nouveau);
                Logger.LogInformation("ImportPictos : nouveau picto « {Uid} » (mhId {MhId}) créé sous la clé {Cle}.",
                    uid, mhId, nouveau.IdPicto);
            }

            foreach (var disparu in rapprochement.ARendreObsoletes)
            {
                disparu.IsObsolete = true;
                DbContext.Update(disparu);
                Logger.LogInformation("ImportPictos : « {Uid} » n'existe plus chez MyHordes, marqué obsolète.",
                    disparu.Uid);
            }

            foreach (var sansIdentite in rapprochement.SansIdentite)
            {
                Logger.LogWarning("ImportPictos : picto {Cle} sans uid, non rapprochable — laissé en l'état.",
                    sansIdentite.IdPicto);
            }

            DbContext.SaveChanges();
            Logger.LogInformation($"{pictosFromMyHordes.Count} pictos importés");
        }

        /// <summary>
        /// Recopie la description d'un picto depuis le référentiel MyHordes.
        /// </summary>
        /// <remarks>
        /// Écriture sous garde : un champ absent ne doit jamais effacer celui qui est déjà connu.
        /// C'est d'autant plus vrai pour <c>community</c>, que SEUL ce référentiel porte — les
        /// récompenses des joueurs ne le transmettent pas.
        /// </remarks>
        private static void AppliquerDescription(Picto picto, MyHordesApiPictoDto dto)
        {
            picto.Img = MyHordesExtensions.RemoveImageFingerprint(dto.Img) ?? picto.Img;
            picto.NameFr = GetLabel(dto.Name, "fr") ?? picto.NameFr;
            picto.NameEn = GetLabel(dto.Name, "en") ?? picto.NameEn;
            picto.NameEs = GetLabel(dto.Name, "es") ?? picto.NameEs;
            picto.NameDe = GetLabel(dto.Name, "de") ?? picto.NameDe;
            picto.DescFr = GetLabel(dto.Desc, "fr") ?? picto.DescFr;
            picto.DescEn = GetLabel(dto.Desc, "en") ?? picto.DescEn;
            picto.DescEs = GetLabel(dto.Desc, "es") ?? picto.DescEs;
            picto.DescDe = GetLabel(dto.Desc, "de") ?? picto.DescDe;
            if (dto.Community.HasValue)
            {
                picto.Community = dto.Community.Value;
            }
            if (dto.Rare.HasValue)
            {
                picto.Rare = dto.Rare.Value;
            }
        }

        private static string GetLabel(IDictionary<string, string> labels, string language)
        {
            return labels != null && labels.TryGetValue(language, out var label) ? label : null;
        }

        /// <summary>
        /// Reporte la clé de la ruine sur ses drops. Le profil de mapping ne peut pas le faire :
        /// la clé appartient à MHO et n'est connue qu'une fois la ligne rapprochée.
        /// </summary>
        /// <summary>
        /// Traduit une clé allemande dans la langue demandée, en repliant sur la clé elle-même
        /// quand aucun fichier ne la porte.
        /// </summary>
        /// <remarks>
        /// <para>
        /// Remplace un <c>.First()</c> qui levait « Sequence contains no elements » dès qu'une clé
        /// manquait, faisant échouer TOUT l'import du référentiel pour un libellé. C'est ce qui
        /// mettait <c>DataImport/HeroSkill</c> en 500 — endpoint qui, d'après les journaux, n'avait
        /// jamais fonctionné.
        /// </para>
        /// <para>
        /// Le repli est le texte ALLEMAND d'origine, c'est-à-dire ce que MyHordes affiche lui-même
        /// faute de traduction : un libellé lisible mais visiblement non traduit vaut mieux qu'une
        /// chaîne vide, et le log nomme la clé pour qu'on puisse la corriger.
        /// </para>
        /// </remarks>
        private string Traduire(Dictionary<string, List<YmlTranslationFileModel>> translations, string langue, string cleAllemande)
        {
            if (string.IsNullOrEmpty(cleAllemande))
            {
                return cleAllemande;
            }
            if (translations == null || !translations.TryGetValue(langue, out var fichiers))
            {
                Logger.LogWarning("Traduction : langue {Langue} absente des fichiers, « {Cle} » laissée en allemand.",
                    langue, cleAllemande);
                return cleAllemande;
            }
            var fichier = fichiers.FirstOrDefault(ymlFileModel => ymlFileModel.Translations.ContainsKey(cleAllemande));
            if (fichier == null)
            {
                Logger.LogWarning("Traduction : aucune correspondance en {Langue} pour « {Cle} », laissée en allemand.",
                    langue, cleAllemande);
                return cleAllemande;
            }
            return MyHordesExtensions.ResolveIcuDefaultForm(fichier.Translations[cleAllemande]);
        }

        private static void PropagerCleAuxDrops(Ruin ruin)
        {
            if (ruin.RuinItemDrops == null)
            {
                return;
            }
            foreach (var drop in ruin.RuinItemDrops)
            {
                drop.IdRuin = ruin.IdRuin;
            }
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

            var ruinsFromDb = DbContext.Ruins
                .Include(ruin => ruin.RuinItemDrops)
                .ToList();

            // Rapprochement sur l'ICÔNE, jamais sur l'identifiant de MyHordes : celui-ci est un
            // auto-incrément de fixtures, qui change d'une instance du jeu à l'autre.
            //
            // Cette identité est PLUS FAIBLE que celle des trois autres référentiels : ZonePrototype
            // n'a pas de champ `name`, l'icône n'identifie que par convention des fixtures. Vérifié
            // le 2026-07-27 : 65 sur 65 sans écart. Un changement d'icône côté jeu passerait pour
            // une disparition et marquerait la ruine obsolète à tort — sans rien détruire, puisque
            // plus rien n'est supprimé, mais la ligne sortirait des catalogues.
            var modelesParImg = ruinModels
                .Where(ruin => !string.IsNullOrEmpty(ruin.Img))
                .ToDictionary(ruin => ruin.Img!, StringComparer.Ordinal);
            var sourceRuines = ruinsFromMyHordes
                .Where(entry => entry.Value.Id.HasValue && !string.IsNullOrEmpty(entry.Value.Img))
                .Select(entry => (Uid: NomIconeNu(entry.Value.Img!), MhId: entry.Value.Id!.Value))
                .ToList();
            // Le « bâtiment non déterré » (IdRuin = -1) est créé par MHO, en miroir du sentinel -1
            // que le jeu renvoie pour une case enterrée. Il n'a aucun prototype derrière lui : sans
            // exemption, chaque import le marquerait obsolète et casserait carte et camping.
            var rapprochementRuines = ReferentialReconciler.Reconcile(
                ruinsFromDb, sourceRuines, ruin => ruin.Img,
                estPropreAMho: ruin => ruin.IdRuin < 0);

            foreach (var (existant, nouveauMhId) in rapprochementRuines.AMettreAJour)
            {
                var modele = modelesParImg[existant.Img!];
                existant.UpdateAllButKeysProperties(modele);
                existant.MhId = nouveauMhId;
                existant.IsObsolete = false;
                PropagerCleAuxDrops(existant);
                DbContext.Update(existant);
            }

            // La clé d'une ruine nouvelle est attribuée par MHO. Ne JAMAIS reprendre mhId : ce serait
            // exactement l'erreur que ce découplage corrige. Le maximum est pris sur les seules clés
            // positives, sans quoi le sentinel -1 fausserait le calcul sur une base vide.
            var prochaineCleRuine = ruinsFromDb.Count == 0
                ? 1
                : Math.Max(0, ruinsFromDb.Max(ruin => ruin.IdRuin)) + 1;
            foreach (var (img, mhId) in rapprochementRuines.ACreer)
            {
                var modele = modelesParImg[img];
                modele.IdRuin = prochaineCleRuine++;
                modele.MhId = mhId;
                PropagerCleAuxDrops(modele);
                DbContext.Ruins.Add(modele);
                Logger.LogInformation("ImportRuins : nouvelle ruine « {Img} » (mhId {MhId}) créée sous la clé {Cle}.",
                    img, mhId, modele.IdRuin);
            }

            foreach (var disparue in rapprochementRuines.ARendreObsoletes)
            {
                disparue.IsObsolete = true;
                DbContext.Update(disparue);
                Logger.LogInformation("ImportRuins : « {Img} » n'existe plus chez MyHordes, marquée obsolète.",
                    disparue.Img);
            }

            foreach (var sansIdentite in rapprochementRuines.SansIdentite)
            {
                Logger.LogWarning("ImportRuins : ruine {Cle} sans icône, non rapprochable — laissée en l'état.",
                    sansIdentite.IdRuin);
            }

            // Le bâtiment non déterré n'est créé que s'il manque : sa clé -1 est référencée par la
            // carte, on ne la réattribue jamais.
            if (!ruinsFromDb.Any(ruin => ruin.IdRuin == -1))
            {
                DbContext.Ruins.Add(new Ruin()
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
            }

            DbContext.SaveChanges();

            // Plan des chantier de ruin
            // Les clés se lisent sur la BASE, et non sur les modèles issus du mapping : ceux-ci ne
            // portent plus de clé, MHO l'attribue au rapprochement.
            var clesParImg = DbContext.Ruins
                .Where(ruin => ruin.Img != null)
                .ToDictionary(ruin => ruin.Img!, ruin => ruin.IdRuin, StringComparer.Ordinal);
            var blueprints = new List<RuinBlueprint>();
            foreach (var ruinModel in ruinModels)
            {
                if (ruinsFromCode.TryGetValue(ruinModel.Img, out var ruinFromCode))
                {
                    if(ruinFromCode.Constructions is not null && clesParImg.TryGetValue(ruinModel.Img, out var cleRuine))
                    {
                        foreach (var buildingId in ruinFromCode.Constructions)
                        {
                            blueprints.Add(new RuinBlueprint()
                            {
                                IdBuilding = buildingId,
                                IdRuin = cleRuine
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
                category.LabelFr = Traduire(translations, "fr", category.LabelDe);
                category.LabelEn = Traduire(translations, "en", category.LabelDe);
                category.LabelEs = Traduire(translations, "es", category.LabelDe);
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

            // Les objets de chaque catégorie sont écrits ICI, et pas par le Patch ci-dessus.
            //
            // `UpdateAllButKeysProperties` saute délibérément les navigations dont la clé étrangère
            // est une clé primaire, et `IdItems` porte justement `[ForeignKey("IdCategory")]` avec
            // `IdCategory` en `[Key]`. Résultat : sur une catégorie DÉJÀ EN BASE — donc sur les neuf
            // que compte le fichier dès le deuxième import — la liste d'objets n'était jamais
            // écrite. Les catégories existaient, vides, et le site n'en montrait aucun objet.
            // Les objets voulus sont figés AVANT toute écriture : pour une catégorie que le Patch
            // vient d'ajouter, l'entité suivie et le modèle sont le MÊME objet, et vider la
            // collection viderait du même coup la source qu'on s'apprête à recopier.
            var objetsVoulus = models.ToDictionary(
                categorie => categorie.IdCategory,
                categorie => categorie.IdItems.ToList());

            var categoriesEnBase = DbContext.WishlistCategories
                .Include(categorie => categorie.IdItems)
                .ToList();
            var rattachements = 0;
            foreach (var categorie in categoriesEnBase)
            {
                if (!objetsVoulus.TryGetValue(categorie.IdCategory, out var objets))
                {
                    continue;
                }
                categorie.IdItems.Clear();
                foreach (var item in objets)
                {
                    categorie.IdItems.Add(item);
                }
                rattachements += objets.Count;
            }
            DbContext.SaveChanges();
            Logger.LogInformation("ImportWishlistCategorie : {Categories} catégories, {Objets} rattachements d'objets.",
                categoriesEnBase.Count, rattachements);
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
                // L'id de classement est la clé de la ville : sans lui il n'y a rien à rapprocher.
                foreach (var townDto in towns.Where(town => town.Id.HasValue))
                {
                    var provisionalId = townDto.MapId.HasValue ? -townDto.MapId.Value : (int?)null;
                    if (bddTownIdSet.Contains(townDto.Id.Value))
                    {
                        // Cas 1 : IdTown correct en BDD → mise à jour classique
                        UpsertTown(townDto);
                    }
                    else if (provisionalId.HasValue && bddTownIdsWithoutMapId.Contains(provisionalId.Value))
                    {
                        // Cas 2 : ligne provisoire (IdTown = -mapId, saison compatible) → migration
                        Logger.LogInformation(
                            "ImportTowns: migration IdTown {OldId} → {NewId} (mapId={MapId})",
                            provisionalId.Value, townDto.Id.Value, townDto.MapId.Value);
                        MigrateTownId(provisionalId.Value, townDto);
                        bddTownIdSet.Remove(provisionalId.Value);
                        bddTownIdsWithoutMapId.Remove(provisionalId.Value);
                        bddTownIdSet.Add(townDto.Id.Value);
                    }
                    else
                    {
                        // Cas 3 : nouvelle ville
                        UpsertTown(townDto);
                        bddTownIdSet.Add(townDto.Id.Value);
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
                // getUsersAPI renvoie une entrée d'erreur (sans id) pour un joueur inconnu — c'est
                // précisément ce que la nullabilité de Id rend maintenant explicite.
                var identityByUserId = identities
                    .Where(identity => identity.Id.HasValue && identity.Id.Value > 0)
                    .ToDictionary(identity => identity.Id.Value);

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
            var townId = dto.Id.Value;
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

            // /json/towns est l'endpoint de CLASSEMENT : il n'expose ni city, ni wid, ni hei (testé
            // en réel le 2026-07-09 sur .de et .eu, et confirmé par le switch de
            // getRankingInformation). Taille, position, type de ville et état des portes ne viennent
            // que de /json/map, via EnrichTownFromMap. Un bloc les lisant ici a existé jusqu'au
            // 2026-07-27 : il n'était jamais exécuté, son garde sur dto.City étant toujours faux.

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
                // L'id identifie le compte : sans lui il n'y a rien à rattacher.
                foreach (var c in map.Citizens.Where(citizen => citizen.Id.HasValue))
                {
                    // Citoyens vivants : getCitizensData délègue à getUserData, le nom est le vrai
                    // pseudo du compte (et non l'alias que renverrait getCadaversInformation).
                    var user = UpsertUser(c.Id.Value, c.Name, c.Avatar, nameIsAuthoritative: true);
                    var citizen = GetOrCreateTownCitizen(townId, user, existingCitizens, ref lastUpdate);
                    citizen.Dead = false;
                    if (!string.IsNullOrEmpty(c.HomeMessage))
                    {
                        citizen.HomeMessage = c.HomeMessage;
                    }
                    // Ces champs-là sont persistés depuis /json/me depuis toujours, mais /json/map ne
                    // les demandait pas : une ville rafraîchie par ce chemin gardait un métier, une
                    // position ou un bannissement périmés. Mêmes colonnes et mêmes gardes que le
                    // profil de mapping de /json/me, pour que les deux chemins ne divergent pas.
                    if (!string.IsNullOrEmpty(c.Job?.Uid))
                    {
                        citizen.JobUid = c.Job.Uid;
                        // Le nom est multilingue côté MyHordes ; la colonne ne retient que le
                        // français, comme le fait déjà le profil de mapping de /json/me.
                        citizen.JobName = c.Job.Name?.ToString();
                    }
                    if (c.X.HasValue)
                    {
                        citizen.PositionX = c.X;
                    }
                    if (c.Y.HasValue)
                    {
                        citizen.PositionY = c.Y;
                    }
                    if (c.Ban.HasValue)
                    {
                        citizen.IsShunned = c.Ban;
                    }
                    // `baseDef` est la défense APPORTÉE par la maison, à ne pas confondre avec
                    // RenfortLevel qui est son niveau d'amélioration.
                    if (c.BaseDef.HasValue)
                    {
                        citizen.HouseDefense = c.BaseDef;
                        var niveau = MyHordesExtensions.NiveauDeMaisonDepuisDefense(c.BaseDef);
                        if (niveau.HasValue)
                        {
                            citizen.HouseLevel = niveau;
                        }
                        else
                        {
                            // Une défense hors table signifie que le jeu a ajouté un niveau : mieux
                            // vaut conserver la valeur connue et le signaler que d'en inventer une.
                            Logger.LogWarning("EnrichTownFromMap : défense de maison {Defense} inconnue pour le citoyen {UserId}, niveau non déduit.",
                                c.BaseDef, c.Id);
                        }
                    }
                }
            }

            if (map.Cadavers != null)
            {
                // L'id identifie le joueur : sans lui il n'y a rien à rattacher.
                foreach (var c in map.Cadavers.Where(cadaver => cadaver.Id.HasValue))
                {
                    var user = UpsertUser(c.Id.Value, c.Name, c.Avatar, nameIsAuthoritative: false);
                    var citizen = GetOrCreateTownCitizen(townId, user, existingCitizens, ref lastUpdate);
                    citizen.Dead = true;
                    citizen.NameInTown = c.Name;
                    var cadaver = GetOrCreateTownCadaver(townId, user, existingCadavers);
                    // Écriture sous garde : ce DTO sert à quatre projections aux champs différents
                    // (playedMaps ne demande ni survival ni dtype), et les chaînes `fields=` ne
                    // font pas partie du contrat. Un champ absent ne doit pas effacer l'existant.
                    if (c.Survival.HasValue)
                    {
                        cadaver.SurvivalDay = c.Survival;
                    }
                    // `sp` = les points d'âme INDIVIDUELS. Surtout pas `score`, que MyHordes expose
                    // au même endroit mais qui est celui de la VILLE, recopié à l'identique sur
                    // chaque cadavre : c'est précisément l'erreur que ce chantier corrige.
                    if (c.Sp.HasValue)
                    {
                        cadaver.SoulPoints = c.Sp;
                    }
                    if (c.Dtype.HasValue)
                    {
                        cadaver.CauseOfDeath = c.Dtype;
                    }
                    if (c.Msg != null)
                    {
                        cadaver.DeathMessage = c.Msg;
                    }
                    if (c.Comment != null)
                    {
                        cadaver.TownMessage = c.Comment;
                    }
                }
            }
        }

        private void UpsertTownCitizens(int townId, List<MyHordesCitizenRankingDto> citizens)
        {
            var existingCitizens = DbContext.TownCitizens
                .Where(c => c.IdTown == townId)
                .ToList();
            var existingCadavers = DbContext.TownCadavers
                .Where(c => c.IdTown == townId)
                .ToList();
            LastUpdateInfo lastUpdate = null;

            foreach (var citizenDto in citizens.Where(citizen => citizen.Id.HasValue))
            {
                // /json/towns passe par getCadaversInformation : le nom peut être un alias
                var user = UpsertUser(citizenDto.Id.Value, citizenDto.Name, citizenDto.Avatar, nameIsAuthoritative: false);
                var citizen = GetOrCreateTownCitizen(townId, user, existingCitizens, ref lastUpdate);
                citizen.NameInTown = citizenDto.Name;
                var isDead = citizenDto.Dtype.HasValue && citizenDto.Dtype.Value > 0;
                citizen.Dead = isDead;
                if (isDead)
                {
                    var cadaver = GetOrCreateTownCadaver(townId, user, existingCadavers);
                    // Écriture sous garde, comme sur le chemin /json/map : même DTO, projections
                    // différentes selon l'appel.
                    if (citizenDto.Survival.HasValue)
                    {
                        cadaver.SurvivalDay = citizenDto.Survival;
                    }
                    // /json/towns ne sert JAMAIS `sp` : cette route filtre les sous-champs de
                    // `citizens` par une liste blanche qui ne le contient pas (JSONv1Controller
                    // l. 1925), contrairement à map.cadavers et playedMaps. Vérifié en réel sur
                    // 4 villes. La garde laisse donc intact ce qu'une autre source a renseigné.
                    if (citizenDto.Sp.HasValue)
                    {
                        cadaver.SoulPoints = citizenDto.Sp;
                    }
                    cadaver.CauseOfDeath = citizenDto.Dtype;
                    if (citizenDto.Msg != null)
                    {
                        cadaver.DeathMessage = citizenDto.Msg;
                    }
                    if (citizenDto.Comment != null)
                    {
                        cadaver.TownMessage = citizenDto.Comment;
                    }
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
                    IdLastUpdateInfoNavigation = lastUpdate,

                    // Défauts à l'initialisation d'un citoyen (état de départ « connu ») :
                    // les actions héroïques sont disponibles par défaut...
                    HasRescue = true,
                    HasUppercut = true,
                    HasSecondWind = true,
                    HasLuckyFind = true,
                    HasCheatDeath = true,
                    HasHeroicReturn = true,
                    // ...sauf APAG, Passage en Force et Camaraderie, laissés inconnus (null).

                    // Améliorations de maison : commencent à 0 / non construit.
                    HouseLevel = 0,
                    HouseDefense = 0,
                    ChestLevel = 0,
                    RenfortLevel = 0,
                    KitchenLevel = 0,
                    LaboLevel = 0,
                    RestLevel = 0,
                    HasAlarm = false,
                    HasCurtain = false,
                    HasFence = false,
                    HasLock = false
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

            // Les listes par défaut désignent les objets par leur IDENTITÉ. La clé MHO se résout
            // ici, à l'import : elle n'appartient pas au fichier, et l'y écrire l'exposerait à
            // devenir fausse au premier objet créé sous une nouvelle clé.
            var clesParUid = DbContext.Items
                .Where(item => item.Uid != null)
                .ToDictionary(item => item.Uid!, item => item.IdItem);

            var modeles = new List<DefaultWishlistItem>();
            foreach (var wishlist in defaultWishlists)
            {
                foreach (var item in wishlist.Items)
                {
                    if (!clesParUid.TryGetValue(item.Uid ?? string.Empty, out var idItem))
                    {
                        // Un objet retiré du jeu, ou une coquille dans le fichier : on écarte la
                        // ligne en la nommant, plutôt que de rattacher la liste à un objet au
                        // hasard ou de faire échouer tout l'import pour une entrée.
                        Logger.LogWarning("ImportDefaultWishlists : objet « {Uid} » inconnu dans la liste {Liste}, entrée ignorée.",
                            item.Uid, wishlist.Id);
                        continue;
                    }
                    modeles.Add(new DefaultWishlistItem()
                    {
                        IdDefaultWishlist = wishlist.Id,
                        IdItem = idItem,
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

        #region Reprise des identifiants MyHordes

        /// <summary>
        /// Remplit la colonne <c>mhId</c> des quatre référentiels — et le <c>uid</c> des pictos —
        /// en rapprochant chaque ligne de MyHordes SUR SON IDENTITÉ.
        /// </summary>
        /// <remarks>
        /// <para>
        /// Opération de reprise, à jouer une seule fois par base après le script
        /// <c>2026_07_28_chantier_dto_myhordes.sql</c>. Elle ne peut pas être écrite en SQL :
        /// résoudre l'identifiant du moment exige d'interroger MyHordes.
        /// </para>
        /// <para>
        /// Ne marque RIEN obsolète : elle constate et rapporte. La décision d'obsolescence est
        /// prise ensuite, au vu du rapport.
        /// </para>
        /// </remarks>
        public async Task<ReferentialBackfillReport> BackfillReferentialIdsAsync()
        {
            var report = new ReferentialBackfillReport();

            report.Referentiels.Add(BackfillItems());
            report.Referentiels.Add(await BackfillBuildingsAsync());
            report.Referentiels.Add(BackfillRuins());
            report.Referentiels.Add(BackfillPictos());

            DbContext.SaveChanges();
            return report;
        }

        private ReferentialBackfillEntry BackfillItems()
        {
            // La clé du dictionnaire de /json/items EST le nom du prototype : l'identité.
            var source = MyHordesApiRepository.GetItems();
            var lignes = DbContext.Items.ToList();
            return Backfill("Item", lignes, source, item => item.Uid,
                (item, mhId) => item.MhId = mhId, item => item.IdItem,
                dto => dto.Id);
        }

        private async Task<ReferentialBackfillEntry> BackfillBuildingsAsync()
        {
            var source = await MyHordesApiRepository.GetBuildingAsync();
            var lignes = DbContext.Buildings.ToList();
            return Backfill("Building", lignes, source, building => building.Uid,
                (building, mhId) => building.MhId = mhId, building => building.IdBuilding,
                dto => dto.Id);
        }

        private ReferentialBackfillEntry BackfillRuins()
        {
            // /json/ruins est indexé par l'identifiant NUMÉRIQUE, pas par un nom : ZonePrototype
            // n'a pas de champ `name`. L'identité d'une ruine est donc son icône, seule convention
            // disponible — et c'est déjà la clé de rapprochement du fichier de code de MHO.
            //
            // Les deux côtés ne l'écrivent pas pareil : Ruin.Img vient du fichier de code et vaut
            // « home », tandis que MyHordes renvoie « ruin/home.cc9a1e8c.gif ». On ramène donc la
            // valeur de MyHordes au nom nu.
            var source = MyHordesApiRepository.GetRuins()
                .Values
                .Where(dto => dto.Id.HasValue && !string.IsNullOrEmpty(dto.Img))
                .ToDictionary(dto => NomIconeNu(dto.Img!), dto => dto);
            // La ruine « bâtiment non déterré » (IdRuin = -1) est créée par MHO, en miroir du
            // sentinel -1 que MyHordes renvoie pour une case enterrée. Aucun prototype ne lui
            // correspond : la compter comme non résolue serait une fausse alerte.
            var lignes = DbContext.Ruins.Where(ruin => ruin.IdRuin > 0).ToList();
            return Backfill("Ruin", lignes, source, ruin => ruin.Img,
                (ruin, mhId) => ruin.MhId = mhId, ruin => ruin.IdRuin,
                dto => dto.Id);
        }

        private ReferentialBackfillEntry BackfillPictos()
        {
            // La clé du dictionnaire de /json/pictos est le nom du prototype (« r_ripflash_#00 »),
            // que l'import jetait jusqu'ici. On en profite pour renseigner la colonne uid.
            var source = MyHordesApiRepository.GetPictos();
            var lignes = DbContext.Pictos.ToList();

            // Les pictos n'ayant pas encore de uid, le premier rapprochement passe par l'id.
            // C'est le SEUL endroit du chantier où l'on s'appuie sur l'identifiant numérique, et
            // c'est inévitable : sans uid en base, il n'existe aucun autre point commun.
            var parMhId = lignes.Where(picto => picto.Uid == null)
                                .ToDictionary(picto => picto.IdPicto);
            foreach (var (nomPrototype, dto) in source)
            {
                if (dto.Id.HasValue && parMhId.TryGetValue(dto.Id.Value, out var picto))
                {
                    picto.Uid = nomPrototype;
                }
            }

            return Backfill("Picto", lignes, source, picto => picto.Uid,
                (picto, mhId) => picto.MhId = mhId, picto => picto.IdPicto,
                dto => dto.Id);
        }

        /// <summary>
        /// Ramène un chemin d'image MyHordes au nom nu de l'icône :
        /// <c>ruin/home.cc9a1e8c.gif</c> devient <c>home</c>.
        /// </summary>
        /// <remarks>
        /// Ni le dossier ni l'empreinte de version ni l'extension ne sont stables ; seul le nom
        /// l'est, et c'est lui que la base stocke, hérité du fichier de code.
        /// </remarks>
        private static string NomIconeNu(string chemin)
        {
            var nomFichier = chemin[(chemin.LastIndexOf('/') + 1)..];
            var premierPoint = nomFichier.IndexOf('.');
            return premierPoint < 0 ? nomFichier : nomFichier[..premierPoint];
        }

        /// <summary>
        /// Rapproche des lignes d'une source MyHordes indexée par identité, et renseigne leur
        /// <c>mhId</c>. Constate sans rien décider.
        /// </summary>
        private static ReferentialBackfillEntry Backfill<TLigne, TDto>(
            string nom,
            List<TLigne> lignes,
            IDictionary<string, TDto> source,
            Func<TLigne, string?> identiteDe,
            Action<TLigne, int> poserMhId,
            Func<TLigne, int> cleDe,
            Func<TDto, int?> mhIdDe)
        {
            var entry = new ReferentialBackfillEntry
            {
                Referentiel = nom,
                LignesEnBase = lignes.Count,
                PrototypesChezMyHordes = source.Count
            };

            var vues = new HashSet<string>(StringComparer.Ordinal);
            foreach (var ligne in lignes)
            {
                var identite = identiteDe(ligne);
                if (string.IsNullOrEmpty(identite))
                {
                    entry.SansIdentite.Add(cleDe(ligne));
                    continue;
                }

                if (source.TryGetValue(identite, out var dto) && mhIdDe(dto).HasValue)
                {
                    poserMhId(ligne, mhIdDe(dto)!.Value);
                    entry.Resolus++;
                    vues.Add(identite);
                }
                else
                {
                    entry.SansCorrespondance.Add(identite);
                }
            }

            entry.AbsentesDeLaBase = source.Keys.Where(cle => !vues.Contains(cle)).ToList();
            return entry;
        }

        #endregion
    }
}
