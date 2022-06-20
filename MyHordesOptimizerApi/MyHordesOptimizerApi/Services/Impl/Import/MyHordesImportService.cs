using AutoMapper;
using Common.Core.Repository.Interfaces;
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
        protected readonly IMyHordesOptimizerRepository MyHordesOptimizerRepository;
        protected readonly IWebApiRepository WebApiRepository;
        protected readonly IMyHordesTranslationsConfiguration TranslationsConfiguration;

        protected IMyHordesApiRepository MyHordesApiRepository;
        protected IMyHordesCodeRepository MyHordesCodeRepository;
        protected readonly IMapper Mapper;

        protected readonly ILogger<MyHordesImportService> Logger;

        public MyHordesImportService(IMyHordesOptimizerRepository firebaseRepository,
            IWebApiRepository webApiRepository,
            IMyHordesTranslationsConfiguration translationsConfiguration,
            IMyHordesApiRepository myHordesJsonApiRepository,
            IMyHordesCodeRepository myHordesCodeRepository,
            IMapper mapper,
            ILogger<MyHordesImportService> logger)
        {
            MyHordesOptimizerRepository = firebaseRepository;
            WebApiRepository = webApiRepository;
            TranslationsConfiguration = translationsConfiguration;
            MyHordesApiRepository = myHordesJsonApiRepository;
            MyHordesCodeRepository = myHordesCodeRepository;
            Mapper = mapper;
            Logger = logger;
        }

        #region HeroSkill

        public async Task ImportHeroSkill()
        {
            var codeResult = MyHordesCodeRepository.GetHeroCapacities();

            var capacities = Mapper.Map<List<HeroSkillsModel>>(codeResult);

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

            MyHordesOptimizerRepository.PatchHeroSkill(capacities);
        }

        #endregion

        #region Items

        public async Task ImportItems()
        {
            // Récupération des items
            var myHordesItems = MyHordesApiRepository.GetItems();
            var mhoItems = Mapper.Map<List<ItemModel>>(myHordesItems);
            MyHordesOptimizerRepository.PatchItems(mhoItems);

            // Récupération des properties
            var codeItemsProperty = MyHordesCodeRepository.GetItemsProperties();
            var allProperties = codeItemsProperty.Values.ToList().SelectMany(list => list).Distinct().ToList();
            MyHordesOptimizerRepository.PatchProperties(allProperties);

            MyHordesOptimizerRepository.DeleteAllPropertiesItem();
            foreach (var kvp in codeItemsProperty)
            {
                var itemUid = kvp.Key;
                var properties = kvp.Value;
                MyHordesOptimizerRepository.PatchPropertiesItem(itemUid, properties);
            }

            // Récupération des actions
            var codeItemsActions = MyHordesCodeRepository.GetItemsActions();
            var allActions = codeItemsActions.Values.ToList().SelectMany(list => list).Distinct().ToList();
            MyHordesOptimizerRepository.PatchActions(allActions);

            MyHordesOptimizerRepository.DeleteAllActionsItem();
            foreach (var kvp in codeItemsActions)
            {
                var itemUid = kvp.Key;
                var actions = kvp.Value;
                MyHordesOptimizerRepository.PatchActionsItem(itemUid, actions);
            }

            //Récupération des recipes
            var codeItemRecipes = MyHordesCodeRepository.GetRecipes();
            var mhoRecipes = Mapper.Map<List<RecipeModel>>(codeItemRecipes);

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
            MyHordesOptimizerRepository.PatchRecipes(mhoRecipes);
            MyHordesOptimizerRepository.DeleteAllRecipeComponents();
            MyHordesOptimizerRepository.DeleteAllRecipeResults();
            foreach (var kvp in codeItemRecipes)
            {
                var recipeName = kvp.Key;
                var componentUids = kvp.Value.In;
                MyHordesOptimizerRepository.PatchRecipeComponents(recipeName, componentUids);
                try
                {
                    var resultsObjects = kvp.Value.Out;
                    var results = new List<RecipeItemResultModel>();
                    var totalWeight = 0;
                    foreach (var @object in resultsObjects)
                    {
                        if (@object is string)
                        {
                            var uid = @object as string;
                            results.Add(new RecipeItemResultModel()
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
                            results.Add(new RecipeItemResultModel()
                            {
                                IdItem = mhoItems.Where(i => i.Uid == uid).Select(i => i.IdItem).First(),
                                Weight = weight,
                                RecipeName = recipeName
                            });
                        }
                    }
                    results.ForEach(x => { if (x.Probability != 1) x.Probability = (float)x.Weight / totalWeight; });
                    MyHordesOptimizerRepository.PatchRecipeResults(results);
                }
                catch (Exception e)
                {
                    Logger.LogError(e, $"Erreur lors de l'enregistrement des réulstats de la recette {recipeName}");
                }
            }
        }

        #endregion

        #region Ruins

        public void ImportRuins()
        {
            var jsonApiResult = MyHordesApiRepository.GetRuins();
            var jsonRuins = Mapper.Map<List<MyHordesOptimizerRuin>>(jsonApiResult);

            var codeResult = MyHordesCodeRepository.GetRuins();
            var codeRuins = Mapper.Map<List<MyHordesOptimizerRuin>>(codeResult);

            var items = MyHordesOptimizerRepository.GetItems();

            foreach (var ruin in jsonRuins)
            {
                var miror = codeRuins.FirstOrDefault(x => x.Img == ruin.Img);
                var codeRuin = codeResult.Values.FirstOrDefault(x => x.Icon == ruin.Img);
                if (miror != null)
                {
                    var totalWeight = 0;
                    foreach (var drop in codeRuin.Drops)
                    {
                        totalWeight += drop.Value;
                        var item = items.FirstOrDefault(x => x.Uid == drop.Key);
                        miror.Drops.Add(new ItemResult()
                        {
                            Item = item,
                            Weight = drop.Value
                        });
                    }
                    miror.Drops.ForEach(x => x.Probability = (double)x.Weight / totalWeight);
                    ruin.HydrateMyHordesCodeValues(miror);
                }
            }

            // Enregistrer dans firebase
            MyHordesOptimizerRepository.PatchRuins(jsonRuins);
        }

        #endregion

        #region Categories

        public async Task ImportCategoriesAsync()
        {
            var codeResult = MyHordesCodeRepository.GetCategories();
            var categories = Mapper.Map<List<CategoryModel>>(codeResult);

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

            MyHordesOptimizerRepository.PatchCategories(categories);
        }

        #endregion
    }
}
