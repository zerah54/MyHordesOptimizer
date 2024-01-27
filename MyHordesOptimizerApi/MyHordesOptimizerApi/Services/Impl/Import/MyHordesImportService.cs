using AutoMapper;
using Common.Core.Repository.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using YamlDotNet.Serialization;

namespace MyHordesOptimizerApi.Services.Impl.Import
{
    public class MyHordesImportService : IMyHordesImportService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected readonly IWebApiRepository WebApiRepository;
        protected readonly IMyHordesTranslationsConfiguration TranslationsConfiguration;

        protected IMyHordesApiRepository MyHordesApiRepository;
        protected IMyHordesCodeRepository MyHordesCodeRepository;
        protected readonly IMapper Mapper;

        protected readonly ILogger<MyHordesImportService> Logger;

        public MyHordesImportService(IServiceScopeFactory serviceScopeFactory,
            IWebApiRepository webApiRepository,
            IMyHordesTranslationsConfiguration translationsConfiguration,
            IMyHordesApiRepository myHordesJsonApiRepository,
            IMyHordesCodeRepository myHordesCodeRepository,
            IMapper mapper,
            ILogger<MyHordesImportService> logger)
        {
            ServiceScopeFactory = serviceScopeFactory;
            WebApiRepository = webApiRepository;
            TranslationsConfiguration = translationsConfiguration;
            MyHordesApiRepository = myHordesJsonApiRepository;
            MyHordesCodeRepository = myHordesCodeRepository;
            Mapper = mapper;
            Logger = logger;
        }


        public async Task ImportAllAsync()
        {
            await ImportHeroSkill();
            await ImportCategoriesAsync();
            await ImportItemsAsync();
            await ImportCauseOfDeath();
            ImportCleanUpTypes();
            ImportRuins();
            ImportWishlistCategorie();
            ImportDefaultWishlists();
        }

        #region HeroSkill

        public async Task ImportHeroSkill()
        {
            var codeResult = MyHordesCodeRepository.GetHeroCapacities();

            var capacities = Mapper.Map<List<HeroSkill>>(codeResult);

            // Traductions
            var ymlDeserializer = new DeserializerBuilder()
                .Build();
            var ymlFr = await WebApiRepository.Get(url: TranslationsConfiguration.GameFrUrl).Content.ReadAsStringAsync();
            var ymlEn = await WebApiRepository.Get(url: TranslationsConfiguration.GameEnUrl).Content.ReadAsStringAsync();
            var ymlEs = await WebApiRepository.Get(url: TranslationsConfiguration.GameEsUrl).Content.ReadAsStringAsync();

            var frenchTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlFr);
            var englishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEn);
            var spanishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEs);
            foreach (var capacitie in capacities)
            {
                capacitie.LabelFr = frenchTrads[capacitie.LabelDe];
                capacitie.LabelEn = englishTrads[capacitie.LabelDe];
                capacitie.LabelEs = spanishTrads[capacitie.LabelDe];
                capacitie.DescriptionFr = frenchTrads[capacitie.DescriptionDe];
                capacitie.DescriptionEn = englishTrads[capacitie.DescriptionDe];
                capacitie.DescriptionEs = spanishTrads[capacitie.DescriptionDe];
            }

            //MyHordesOptimizerRepository.PatchHeroSkill(capacities);
        }

        #endregion

        #region CauseOfDeath

        public async Task ImportCauseOfDeath()
        {
            var codeResult = MyHordesCodeRepository.GetCausesOfDeath();

            var causesOfDeaths = Mapper.Map<List<CauseOfDeath>>(codeResult);

            // Traductions
            var ymlDeserializer = new DeserializerBuilder().Build();
            var ymlFr = await WebApiRepository.Get(url: TranslationsConfiguration.GameFrUrl).Content.ReadAsStringAsync();
            var ymlEn = await WebApiRepository.Get(url: TranslationsConfiguration.GameEnUrl).Content.ReadAsStringAsync();
            var ymlEs = await WebApiRepository.Get(url: TranslationsConfiguration.GameEsUrl).Content.ReadAsStringAsync();

            var frenchTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlFr);
            var englishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEn);
            var spanishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEs);
            foreach (var causeOfDeath in causesOfDeaths)
            {
                causeOfDeath.LabelFr = frenchTrads[causeOfDeath.LabelDe];
                causeOfDeath.LabelEn = englishTrads[causeOfDeath.LabelDe];
                causeOfDeath.LabelEs = spanishTrads[causeOfDeath.LabelDe];
                causeOfDeath.DescriptionFr = frenchTrads[causeOfDeath.DescriptionDe];
                causeOfDeath.DescriptionEn = englishTrads[causeOfDeath.DescriptionDe];
                causeOfDeath.DescriptionEs = spanishTrads[causeOfDeath.DescriptionDe];
            }

            //MyHordesOptimizerRepository.PatchCauseOfDeath(causesOfDeaths);
        }

        #endregion

        #region CleanUpTypes

        public void ImportCleanUpTypes()
        {
            var codeResult = MyHordesCodeRepository.GetCleanUpTypes();

            var cleanUpTypes = Mapper.Map<List<TownCadaverCleanUpType>>(codeResult);

            //MyHordesOptimizerRepository.PatchCleanUpType(cleanUpTypes);
        }

        #endregion

        #region Items

        public async Task ImportItemsAsync()
        {
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
                    item.DropRatePraf = Convert.ToInt32(dropWeight[0]) / totalWeightPraf;
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
                    item.DropRateNotPraf = Convert.ToInt32(dropWeight[0]) / totalWeightNotPraf;
                }
                else
                {
                    item.DropRateNotPraf = 0;
                }
            });
            //MyHordesOptimizerRepository.PatchItems(mhoItems);

            // Récupération des properties
            var codeItemsProperty = MyHordesCodeRepository.GetItemsProperties();
            var allProperties = codeItemsProperty.Values.ToList().SelectMany(list => list).Distinct().ToList();
            //MyHordesOptimizerRepository.PatchProperties(allProperties);

            //MyHordesOptimizerRepository.DeleteAllPropertiesItem();
            foreach (var kvp in codeItemsProperty)
            {
                var itemUid = kvp.Key;
                var properties = kvp.Value;
                //MyHordesOptimizerRepository.PatchPropertiesItem(itemUid, properties);
            }

            // Récupération des actions
            var codeItemsActions = MyHordesCodeRepository.GetItemsActions();
            var allActions = codeItemsActions.Values.ToList().SelectMany(list => list).Distinct().ToList();
            //MyHordesOptimizerRepository.PatchActions(allActions);

            //MyHordesOptimizerRepository.DeleteAllActionsItem();
            foreach (var kvp in codeItemsActions)
            {
                var itemUid = kvp.Key;
                var actions = kvp.Value;
                //MyHordesOptimizerRepository.PatchActionsItem(itemUid, actions);
            }

            //Récupération des recipes
            var codeItemRecipes = MyHordesCodeRepository.GetRecipes();
            var mhoRecipes = Mapper.Map<List<Recipe>>(codeItemRecipes);

            // Traductions
            var ymlDeserializer = new DeserializerBuilder()
                .Build();
            var ymlFr = await WebApiRepository.Get(url: TranslationsConfiguration.ItemFrUrl).Content.ReadAsStringAsync();
            var ymlEn = await WebApiRepository.Get(url: TranslationsConfiguration.ItemEnUrl).Content.ReadAsStringAsync();
            var ymlEs = await WebApiRepository.Get(url: TranslationsConfiguration.ItemEsUrl).Content.ReadAsStringAsync();

            var frenchTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlFr);
            var englishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEn);
            var spanishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEs);
            foreach (var recipe in mhoRecipes)
            {
                if (recipe.ActionDe != null)
                {
                    recipe.ActionFr = frenchTrads[recipe.ActionDe];
                    recipe.ActionEn = englishTrads[recipe.ActionDe];
                    recipe.ActionEs = spanishTrads[recipe.ActionDe];
                }
            }
            //MyHordesOptimizerRepository.PatchRecipes(mhoRecipes);
            //MyHordesOptimizerRepository.DeleteAllRecipeComponents();
            //MyHordesOptimizerRepository.DeleteAllRecipeResults();
            foreach (var kvp in codeItemRecipes)
            {
                var recipeName = kvp.Key;
                var componentUids = kvp.Value.In;
                //MyHordesOptimizerRepository.PatchRecipeComponents(recipeName, componentUids);
                try
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
                }
                catch (Exception e)
                {
                    Logger.LogError(e, $"Erreur lors de l'enregistrement des réulstats de la recette {recipeName}");
                }
            }

            // Récupération des droprates dans l'OM
        }

        #endregion

        #region Ruins

        public void ImportRuins()
        {
            var jsonApiResult = MyHordesApiRepository.GetRuins();
            var jsonRuins = Mapper.Map<List<MyHordesOptimizerRuinDto>>(jsonApiResult);

            var codeResult = MyHordesCodeRepository.GetRuins();

            Logger.LogDebug($"codeResult {codeResult}");

            var codeRuins = Mapper.Map<List<MyHordesOptimizerRuinDto>>(codeResult);

            Logger.LogDebug($"codeRuins {codeResult}");

            //var items = MyHordesOptimizerRepository.GetItems();

            foreach (var ruin in jsonRuins)
            {
                var miror = codeRuins.FirstOrDefault(x => x.Img == ruin.Img);
                var codeRuin = codeResult.Values.FirstOrDefault(x => x.Icon == ruin.Img);
                if (miror != null)
                {
                    var totalWeight = 0;
                    foreach (var drop in codeRuin.Drops)
                    {
                        totalWeight += Convert.ToInt32(drop.Value[0]);
                        //var item = items.FirstOrDefault(x => x.Uid == drop.Key);
                        miror.Drops.Add(new ItemResultDto()
                        {
                            //Item = Mapper.Map<ItemDto>(item),
                            Weight = Convert.ToInt32(drop.Value[0])
                        });
                    }
                    miror.Drops.ForEach(x => x.Probability = (double)x.Weight / totalWeight);
                    ruin.HydrateMyHordesCodeValues(miror);
                }
            }

            // Enregistrer dans firebase
            jsonRuins.Add(new MyHordesOptimizerRuinDto()
            {
                Id = -1,
                Camping = 15,
                Label = new Dictionary<string, string>()
                {
                      { "fr", "Bâtiment non déterré" },
                      { "en", "Buried building" },
                      { "de", "Verschüttete Ruine" },
                      { "es", "Sector inexplotable" }
                },
                Chance = 0,
                Explorable = false,
                Img = "burried",
                MinDist = 1,
                MaxDist = 1000,
                Capacity = 0
            });
            //MyHordesOptimizerRepository.PatchRuins(jsonRuins);
        }

        #endregion

        #region Categories

        public async Task ImportCategoriesAsync()
        {
            var codeResult = MyHordesCodeRepository.GetCategories();
            var categories = Mapper.Map<List<Category>>(codeResult);

            // Traductions
            var ymlDeserializer = new DeserializerBuilder()
                .Build();
            var ymlFr = await WebApiRepository.Get(url: TranslationsConfiguration.ItemFrUrl).Content.ReadAsStringAsync();
            var ymlEn = await WebApiRepository.Get(url: TranslationsConfiguration.ItemEnUrl).Content.ReadAsStringAsync();
            var ymlEs = await WebApiRepository.Get(url: TranslationsConfiguration.ItemEsUrl).Content.ReadAsStringAsync();

            var frenchTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlFr);
            var englishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEn);
            var spanishTrads = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlEs);
            foreach (var category in categories)
            {
                category.LabelFr = frenchTrads[category.LabelDe];
                category.LabelEn = englishTrads[category.LabelDe];
                category.LabelEs = spanishTrads[category.LabelDe];
            }

            //MyHordesOptimizerRepository.PatchCategories(categories);
        }

        #endregion

        #region Wishlist

        public void ImportWishlistCategorie()
        {
            //var wishlistCategories = MyHordesCodeRepository.GetWishlistItemCategories();
            //var categories = Mapper.Map<List<WishlistCategorie>>(wishlistCategories);

            //var itemsCategorie = new List<WishlistCategorie>();
            //foreach (var category in wishlistCategories)
            //{
            //    foreach (var item in category.Items)
            //    {
            //        itemsCategorie.Add(new WishlistCategorie()
            //        {
            //            IdCategory = category.Id,
            //            IdItem = item
            //        });
            //    }
            //}

            //MyHordesOptimizerRepository.PatchWishlistCategories(categories);
            //MyHordesOptimizerRepository.PatchWishlistItemCategories(itemsCategorie);
        }

        public void ImportDefaultWishlists()
        {
            var wishlistCategories = MyHordesCodeRepository.GetWishlistItemCategories();
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
                        Depot = Convert.ToUInt64(item.Depot),
                        ShouldSignal = Convert.ToUInt64(item.ShouldSignal),
                        Priority = item.Priority,
                        ZoneXpa = item.ZoneXPa
                    });
                }
                foreach (var categorie in wishlist.Categories)
                {
                    var wishlistCategorie = wishlistCategories.Single(x => x.Id == categorie.CategorieId);
                    foreach (var itemId in wishlistCategorie.Items)
                    {
                        modeles.Add(new DefaultWishlistItem()
                        {
                            IdDefaultWishlist = wishlist.Id,
                            IdItem = itemId,
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

            //MyHordesOptimizerRepository.PatchDefaultWishlistItems(modeles);
        }

        #endregion
    }
}
