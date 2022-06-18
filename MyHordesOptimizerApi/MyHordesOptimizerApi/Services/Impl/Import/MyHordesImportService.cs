﻿using AutoMapper;
using Common.Core.Repository.Interfaces;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes.Import;
using MyHordesOptimizerApi.Dtos.MyHordes.Import.i18n;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using PCRE;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mime;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using YamlDotNet.Serialization;

namespace MyHordesOptimizerApi.Services.Impl.Import
{
    public class MyHordesImportService : IMyHordesImportService
    {
        protected readonly IMyHordesOptimizerRepository MyHordesOptimizerRepository;
        protected readonly IWebApiRepository WebApiRepository;
        protected readonly IMyHordesTranslationsConfiguration TranslationsConfiguration;

        protected IMyHordesJsonApiRepository MyHordesJsonApiRepository { get; set; }
        protected IMyHordesXmlApiRepository MyHordesXmlApiRepository { get; set; }
        protected IMyHordesCodeRepository MyHordesCodeRepository { get; set; }
        protected readonly IMapper Mapper;


        public MyHordesImportService(IMyHordesOptimizerRepository firebaseRepository,
            IWebApiRepository webApiRepository,
            IMyHordesTranslationsConfiguration translationsConfiguration,
            IMyHordesJsonApiRepository myHordesJsonApiRepository,
            IMyHordesXmlApiRepository myHordesXmlApiRepository,
            IMyHordesCodeRepository myHordesCodeRepository,
            IMapper mapper)
        {
            MyHordesOptimizerRepository = firebaseRepository;
            WebApiRepository = webApiRepository;
            TranslationsConfiguration = translationsConfiguration;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            MyHordesXmlApiRepository = myHordesXmlApiRepository;
            MyHordesCodeRepository = myHordesCodeRepository;
            Mapper = mapper;
        }

        #region HeroSkill

        public void ImportHeroSkill(ImportHeroSkillRequestDto request)
        {
            var heroSkills = GetHeroSkillInDeutch(request.HeroSkill).ToList();
            // Ajouter les trad
            AddHeroSkillTraduction(request.Fr, heroSkills, "fr");
            AddHeroSkillTraduction(request.Es, heroSkills, "es");
            AddHeroSkillTraduction(request.En, heroSkills, "en");
            // Enregistrer dans firebase
            MyHordesOptimizerRepository.PatchHeroSkill(heroSkills);
        }

        private void AddHeroSkillTraduction(string url, List<HeroSkill> heroSkillsWithoutTrad, string locale)
        {
            var translationFile = WebApiRepository.Get<TranslationXmlFileDto>(url: url, mediaTypeOut: MediaTypeNames.Application.Xml);
            foreach (var heroSkill in heroSkillsWithoutTrad)
            {
                var descriptionUnit = translationFile.File.Unit.First(unit => unit.Segment.Source == heroSkill.Description[HeroSkill.DefaultLocale]);
                heroSkill.Description[locale] = descriptionUnit.Segment.Target;
                var labelUnit = translationFile.File.Unit.First(unit => unit.Segment.Source == heroSkill.Label[HeroSkill.DefaultLocale]);
                heroSkill.Label[locale] = labelUnit.Segment.Target;
            }
        }

        private IEnumerable<HeroSkill> GetHeroSkillInDeutch(string heroSkillStr)
        {
            heroSkillStr = RemoveComments(heroSkillStr);
            var heroSkillStrSplit = Regex.Split(heroSkillStr, "\\n");
            var listOfDictionnary = new List<Dictionary<string, string>>();
            foreach (var line in heroSkillStrSplit)
            {
                if (!string.IsNullOrWhiteSpace(line))
                {
                    var workingLine = line;
                    workingLine = workingLine.TrimEnd();
                    if (workingLine.EndsWith(","))
                    {
                        workingLine = workingLine.Remove(workingLine.Length - 1);
                    }
                    workingLine = workingLine.Replace("[", "");
                    workingLine = workingLine.Replace("]", "");

                    var items = SplitOnCommaNotInString(workingLine, "'");

                    Dictionary<string, string> dico = GenerateDictionnaryFromItem(items);
                    listOfDictionnary.Add(dico);
                }
            }

            foreach (var workingHeroSkill in listOfDictionnary)
            {
                var heroSkill = new HeroSkill();
                heroSkill.Name = workingHeroSkill["name"];
                heroSkill.Label["de"] = workingHeroSkill["title"];
                heroSkill.Description["de"] = workingHeroSkill["description"];
                heroSkill.Icon = workingHeroSkill["icon"];
                heroSkill.DaysNeeded = int.Parse(workingHeroSkill["daysNeeded"]);
                yield return heroSkill;
            }
        }

        #endregion

        #region Items

        public void ImportItems(ImportItemsRequestDto request)
        {
            var items = GetItemFromMyHordesApis();
            ParseItemInfo(request.ItemsProperties, items, nameof(Item.Properties));
            ParseItemInfo(request.ItemActions, items, nameof(Item.Actions));
            // Traductions
            var translationFileFr = WebApiRepository.Get<TranslationXmlFileDto>(url: request.Fr, mediaTypeOut: MediaTypeNames.Application.Xml);
            var translationFileEn = WebApiRepository.Get<TranslationXmlFileDto>(url: request.En, mediaTypeOut: MediaTypeNames.Application.Xml);
            var translationFileEs = WebApiRepository.Get<TranslationXmlFileDto>(url: request.Es, mediaTypeOut: MediaTypeNames.Application.Xml);
            GetTranslationFromTarget(items: items, translationFile: translationFileFr, targetLocale: "fr", "de", nameof(Item.Description));
            GetTranslationFromSource(items: items, translationFile: translationFileEn, targetLocale: "en", "de", nameof(Item.Description));
            GetTranslationFromSource(items: items, translationFile: translationFileEs, targetLocale: "es", "de", nameof(Item.Description));
            // Enregistrer dans firebase
            MyHordesOptimizerRepository.PatchItems(items);

            // Gestion des recipes
            var recipeStr = RemoveComments(request.Recipes);
            var recipesLine = Regex.Split(recipeStr, "\\n");
            var recipes = new List<ItemRecipe>();
            var firebaseItems = MyHordesOptimizerRepository.GetItems().ToList();
            foreach (var line in recipesLine)
            {
                if (!string.IsNullOrWhiteSpace(line))
                {
                    var recipeNameSplit = SplitOnStringNotInBraces(line, "=>");
                    var recipeName = recipeNameSplit[0].Replace("'", "").Trim();
                    var recipeProperties = recipeNameSplit[1].ReplaceFirstOccurrence("[", "").ReplaceLastOccurrence("]", "").Trim(); // A partir de la on ça soit 'type' => Recipe::WorkshopType, 'in' => 'metal_beam_#00',      'out' => 'metal_#00', 'action' => 'Wandeln'
                                                                                                                                     // Soit 'type' => Recipe::WorkshopType, 'in' => 'electro_box_#00',     'out' => [ ['pile_#00', 15], ['pilegun_empty_#00', 16], ['electro_#00', 23], ['meca_parts_#00', 18], ['tagger_#00', 14], ['deto_#00', 14] ], 'action' => 'Zerlegen' 
                                                                                                                                     // Il faut gérer le out avec des braces
                    var propertieLines = SplitOnStringNotInBracesAndString(strToParse: recipeProperties, searchedStr: ",", englobingStr: "'");
                    var dico = GenerateDictionnaryFromItem(propertieLines);

                    var type = dico["type"];
                    var @in = dico["in"]; // On récupère soit un truc du genre 'catbox_#00' soit ['music_part_#00', 'pile_#00', 'electro_#00']
                    @in = @in.Replace("[", "").Replace("]", "").Trim();
                    var ins = SplitOnCommaNotInString(@in, "'");
                    var @out = dico["out"];
                    dico.TryGetValue("action", out var action);

                    var recipe = new ItemRecipe();
                    recipe.Name = recipeName;
                    switch (type)
                    {
                        case "Recipe::WorkshopTypeShamanSpecific":
                        case "Recipe::WorkshopType":
                            recipe.Type = ItemRecipeType.Workshop.GetDescription();
                            break;
                        case "Recipe::ManualAnywhere":
                            recipe.Type = ItemRecipeType.Manual.GetDescription();
                            break;
                        default:
                            break;
                    }
                    recipe.IsShamanOnly = type == "Recipe::WorkshopTypeShamanSpecific";
                    recipe.Actions["de"] = action;
                    if (@out.IndexOf("[") < 0) // si on a qu'un seul objet
                                               // 'out' => 'metal_#00'
                    {
                        @out = @out.Replace("'", "").Remove(dico["out"].Length - 4);
                        foreach (var item in firebaseItems.Where(x => x.JsonIdName == @out))
                        {
                            var itemResult = new ItemResult()
                            {
                                Item = item,
                                Probability = 1
                            };
                            recipe.Result.Add(itemResult);
                        }
                    }
                    else // On peut avoir plusieurs résultat
                         // 'out' => [ ['pile_#00', 15], ['pilegun_empty_#00', 16], ['electro_#00', 23], ['meca_parts_#00', 18], ['tagger_#00', 14], ['deto_#00', 14] ]
                    {
                        @out = @out.ReplaceFirstOccurrence("[", "").ReplaceLastOccurrence("]", "");
                        var splitedOuts = SplitOnStringNotInBracesAndString(@out, ",", "'");
                        foreach (var outLine in splitedOuts) // ['pile_#00', 15]
                        {
                            var workingItem = outLine.Replace("[", "").Replace("]", "").Trim();
                            var splitedWorkingItem = workingItem.Split(",");
                            var itemName = splitedWorkingItem[0].Replace("'", "");
                            itemName = itemName.Remove(itemName.Length - 4);
                            var weight = int.Parse(splitedWorkingItem[1]);
                            foreach (var item in firebaseItems.Where(x => x.JsonIdName == itemName))
                            {
                                var itemResult = new ItemResult()
                                {
                                    Item = item,
                                    Weight = weight
                                };
                                recipe.Result.Add(itemResult);
                            }
                        }
                        var totalWeight = recipe.Result.Sum(x => x.Weight);
                        recipe.Result.ForEach(x => x.Probability = (double)x.Weight / totalWeight);
                    }

                    foreach (var itemIn in ins)
                    {
                        var xmlNumber = int.Parse(itemIn.Substring(itemIn.Length - 2)); // On récupère juste le numéro
                        var itemName = itemIn.Remove(itemIn.Length - 4).Trim(); // On manipule un truc du genre saw_tool_#00, du coup on enlève le _#00;
                        var componentItemsFromFirebase = firebaseItems.Where(x => x.JsonIdName == itemName).ToList();
                        if (componentItemsFromFirebase.Count == 1) // Si un seul item correspond au json name, alors on l'ajoute à la liste des composant
                        {
                            recipe.Components.Add(componentItemsFromFirebase.First());
                        }
                        else // Sinon, ça veut dire que pour le même JsonName on a potentiellement plusière item (prints, soul_bleu), du coup on le récupère à partir du xmlId et du numéro _#01 (ou _#02, etc)
                        {
                            recipe.Components.Add(firebaseItems.Where(x => x.XmlId == componentItemsFromFirebase.First().XmlId + xmlNumber).First());
                        }
                    }
                    recipes.Add(recipe);
                }
            }
            //

            // On ajoute les traduction
            GetTranslationFromSource(items: recipes, translationFile: translationFileFr, targetLocale: "fr", "de", nameof(ItemRecipe.Actions));
            GetTranslationFromSource(items: recipes, translationFile: translationFileEn, targetLocale: "en", "de", nameof(ItemRecipe.Actions));
            GetTranslationFromSource(items: recipes, translationFile: translationFileEs, targetLocale: "es", "de", nameof(ItemRecipe.Actions));

            MyHordesOptimizerRepository.PatchRecipes(recipes);
        }

        private static void ParseItemInfo(string strToParse, List<Item> items, string propertieName)
        {
            strToParse = RemoveComments(strToParse);
            var strSplit = Regex.Split(strToParse, "\\n");
            foreach (var line in strSplit)
            {
                if (!string.IsNullOrWhiteSpace(line))
                {
                    var splited = Regex.Split(line, "=>");
                    var key = splited[0].Replace("'", "").Trim(); // On récupère un truc du genre saw_tool_#00
                    key = key.Remove(key.Length - 4); // On retire le _#00
                    var properties = splited[1].Replace("[", "").Replace("]", "").Trim(); // On récupère un truc du genre 'impoundable', 'can_opener', 'box_opener'
                    var list = new List<string>();
                    foreach (var propertie in properties.Split(','))
                    {
                        var propertieValue = propertie.Replace("'", "").Trim();
                        if (!string.IsNullOrWhiteSpace(propertieValue))
                        {
                            list.Add(propertieValue);
                        }
                    }
                    Item item = items.FirstOrDefault(item => item.JsonIdName == key);
                    if (item != null)
                    {
                        typeof(Item).GetProperty(propertieName).SetValue(item, list);
                    }
                }
            }
        }

        private List<Item> GetItemFromMyHordesApis()
        {
            var jsonApiResult = MyHordesJsonApiRepository.GetItems();
            var jsonItems = Mapper.Map<List<Item>>(jsonApiResult);

            var xmlApiResult = MyHordesXmlApiRepository.GetItems();
            var xmlItems = Mapper.Map<List<Item>>(xmlApiResult.Data.Items.Item);

            foreach (var item in xmlItems)
            {
                var miror = jsonItems.FirstOrDefault(x => x.Img == item.Img);
                if (miror != null)
                {
                    item.JsonIdName = miror.JsonIdName;
                    item.Label = miror.Label;
                }
            }
            return xmlItems;
        }

        #endregion

        #region Ruins

        public void ImportRuins()
        {
            var jsonApiResult = MyHordesJsonApiRepository.GetRuins();
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
                        var itemKey = drop.Key.Remove(drop.Key.Length - 4); // On retire le _#00
                        var item = items.FirstOrDefault(x => x.JsonIdName == itemKey);
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

        #region privatesUtils

        private static string[] SplitOnStringNotInBraces(string strToParse, string searchedStr)
        {
            // var regex = new Regex("(?![^)(]*\\([^)(]*?\\)\\)),(?![^\\[]*\\])");
            var regex = new PcreRegex($"(\\[(?:[^[\\]]++|(?1))*\\])(*SKIP)(*F)|{searchedStr}");

            var workingAllProperties = regex.Replace(strToParse, "\n");
            return workingAllProperties.Split("\n");
        }

        private static string[] SplitOnStringNotInBracesAndString(string strToParse, string searchedStr, string englobingStr)
        {
            searchedStr = GeneratePaternForSearchedStringNotInEnglobingStr(englobingStr, searchedStr);
            var pattern = $"(\\[(?:[^[\\]]++|(?1))*\\])(*SKIP)(*F)|{searchedStr}";

            var regex = new PcreRegex(pattern);

            var workingAllProperties = regex.Replace(strToParse, "\n");
            return workingAllProperties.Split("\n");
        }

        private static string[] SplitOnCommaNotInString(string strToParse, string englobingStr)
        {
            var searchedStr = ",";
            var pattern = GeneratePaternForSearchedStringNotInEnglobingStr(englobingStr, searchedStr);
            var regex = new Regex(pattern);
            var workingAllProperties = regex.Replace(strToParse, "\n");
            return workingAllProperties.Split("\n");
        }

        private static string GeneratePaternForSearchedStringNotInEnglobingStr(string englobingStr, string searchedStr)
        {
            return $"(?!\\B{englobingStr}[^{englobingStr}]*){searchedStr}(?![^{englobingStr}]*{englobingStr}\\B)";
        }

        private static string RemoveComments(string recipeStr)
        {
            var blockComments = @"/\*(.*?)\*/";
            var lineComments = @"//(.*?)\r?\n";
            var strings = @"""((\\[^\n]|[^""\n])*)""";
            var verbatimStrings = @"@(""[^""]*"")+";

            string noComments = Regex.Replace(recipeStr,
                                              blockComments + "|" + lineComments + "|" + strings + "|" + verbatimStrings,
                                              me =>
                                              {
                                                  if (me.Value.StartsWith("/*") || me.Value.StartsWith("//"))
                                                      return me.Value.StartsWith("//") ? "\n" : String.Empty;
                                                  // Keep the literal strings
                                                  return me.Value;
                                              },
                                              RegexOptions.Singleline);
            return noComments;
        }

        private static void GetTranslationFromTarget<TParam>(List<TParam> items, TranslationXmlFileDto translationFile, string targetLocale, string sourceLocale, string propertieName) where TParam : class
        {
            foreach (var item in items)
            {
                var property = typeof(TParam).GetProperty(propertieName);
                var dictionary = property.GetValue(item) as IDictionary<string, string>;
                var descriptionUnit = translationFile.File.Unit.First(unit => unit.Segment.Target == dictionary[targetLocale]);
                dictionary[sourceLocale] = descriptionUnit.Segment.Source;
                property.SetValue(item, dictionary);
            }
        }

        private static void GetTranslationFromSource<TParam>(List<TParam> items, TranslationXmlFileDto translationFile, string targetLocale, string sourceLocale, string propertieName) where TParam : class
        {
            foreach (var item in items)
            {
                var property = typeof(TParam).GetProperty(propertieName);
                var dictionary = property.GetValue(item) as IDictionary<string, string>;
                if (!string.IsNullOrWhiteSpace(dictionary[sourceLocale]))
                {
                    var descriptionUnit = translationFile.File.Unit.First(unit => unit.Segment.Source == dictionary[sourceLocale]);
                    dictionary[targetLocale] = descriptionUnit.Segment.Target;
                    property.SetValue(item, dictionary);
                }
            }
        }

        /// <summary>
        /// Génère un dictionnaire à partie d'une chaine du type ['type' => Recipe::WorkshopType, 'in' => 'repair_kit_part_#00', 'out' => 'repair_kit_#00', 'action' => 'Wandeln']
        /// </summary>
        /// <param name="items"></param>
        /// <returns></returns>
        private static Dictionary<string, string> GenerateDictionnaryFromItem(string[] items)
        {
            var dico = new Dictionary<string, string>();
            foreach (var item in items)
            {
                if (!string.IsNullOrWhiteSpace(item))
                {
                    var splited = Regex.Split(item, "=>");
                    var key = splited[0].Replace("'", "").Trim();
                    var value = splited[1].Replace("'", "").Trim();
                    dico[key] = value;
                }
            }
            return dico;
        }

        #endregion
    }
}
