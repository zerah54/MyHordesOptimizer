using AutoMapper;
using Common.Core.Repository.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes.Import;
using MyHordesOptimizerApi.Dtos.MyHordes.Import.i18n;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using PCRE;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mime;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.Services.Impl.Import
{
    public class MyHordesImportService : IMyHordesImportService
    {
        protected readonly IMyHordesOptimizerFirebaseRepository FirebaseRepository;
        protected readonly IWebApiRepository WebApiRepository;
        protected IMyHordesJsonApiRepository MyHordesJsonApiRepository { get; set; }
        protected IMyHordesXmlApiRepository MyHordesXmlApiRepository { get; set; }
        protected readonly IMapper Mapper;


        public MyHordesImportService(IMyHordesOptimizerFirebaseRepository firebaseRepository,
            IWebApiRepository webApiRepository,
            IMyHordesJsonApiRepository myHordesJsonApiRepository,
            IMyHordesXmlApiRepository myHordesXmlApiRepository,
            IMapper mapper)
        {
            FirebaseRepository = firebaseRepository;
            WebApiRepository = webApiRepository;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            MyHordesXmlApiRepository = myHordesXmlApiRepository;
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
            FirebaseRepository.PatchHeroSkill(heroSkills);
        }

        private void AddHeroSkillTraduction(string url, List<HeroSkill> heroSkillsWithoutTrad, string locale)
        {
            var translationFile = WebApiRepository.Get<TranslationFileDto>(url: url, mediaTypeOut: MediaTypeNames.Application.Xml);
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
            var translationFileFr = WebApiRepository.Get<TranslationFileDto>(url: request.Fr, mediaTypeOut: MediaTypeNames.Application.Xml);
            var translationFileEn = WebApiRepository.Get<TranslationFileDto>(url: request.En, mediaTypeOut: MediaTypeNames.Application.Xml);
            var translationFileEs = WebApiRepository.Get<TranslationFileDto>(url: request.Es, mediaTypeOut: MediaTypeNames.Application.Xml);
            GetTranslationFromTarget(items: items, translationFile: translationFileFr, targetLocale: "fr", "de", nameof(Item.Description));
            GetTranslationFromSource(items: items, translationFile: translationFileEn, targetLocale: "en", "de", nameof(Item.Description));
            GetTranslationFromSource(items: items, translationFile: translationFileEs, targetLocale: "es", "de", nameof(Item.Description));
            // Enregistrer dans firebase
            FirebaseRepository.PatchItems(items);

            // Gestion des recipes
            var recipeStr = RemoveComments(request.Recipes);
            var recipesLine = Regex.Split(recipeStr, "\\n");
            var recipes = new List<ItemRecipe>();
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
                        @out = @out.Replace("'","").Remove(dico["out"].Length - 4);
                        var item = FirebaseRepository.GetItemByJsonIdName(@out);
                        var itemResult = new ItemResult()
                        {
                            Item = item,
                            Probability = 1
                        };
                        recipe.Result.Add(itemResult);
                    }
                    else // On peut avoir plusieurs résultat
                         // 'out' => [ ['pile_#00', 15], ['pilegun_empty_#00', 16], ['electro_#00', 23], ['meca_parts_#00', 18], ['tagger_#00', 14], ['deto_#00', 14] ]
                    {
                        @out = @out.ReplaceFirstOccurrence("[", "").ReplaceLastOccurrence("]", "");
                        var splitedOuts = SplitOnStringNotInBracesAndString(@out, ",", "'");
                        foreach(var outLine in splitedOuts) // ['pile_#00', 15]
                        {
                            var workingItem = outLine.Replace("[", "").Replace("]", "").Trim();
                            var splitedWorkingItem = workingItem.Split(",");
                            var itemName = splitedWorkingItem[0].Replace("'", "");
                            itemName = itemName.Remove(itemName.Length - 4);
                            var weight = int.Parse(splitedWorkingItem[1]);

                            var item = FirebaseRepository.GetItemByJsonIdName(itemName);
                            var itemResult = new ItemResult()
                            {
                                Item = item,
                                Weight = weight
                            };
                            recipe.Result.Add(itemResult);
                        }
                        var totalWeight = recipe.Result.Sum(x => x.Weight);
                        recipe.Result.ForEach(x => x.Probability = (double) x.Weight / totalWeight);
                    }
                    foreach (var itemIn in ins)
                    {
                        var itemName = itemIn.Remove(itemIn.Length - 4).Trim();
                        Item item = FirebaseRepository.GetItemByJsonIdName(itemName);
                        recipe.Components.Add(item);// On manipule un truc du genre saw_tool_#00, du coup on enlève le _#00;
                    }
                    recipes.Add(recipe);
                }
            }

            // On ajoute les traduction
            GetTranslationFromSource(items: recipes, translationFile: translationFileFr, targetLocale: "fr", "de", nameof(ItemRecipe.Actions));
            GetTranslationFromSource(items: recipes, translationFile: translationFileEn, targetLocale: "en", "de", nameof(ItemRecipe.Actions));
            GetTranslationFromSource(items: recipes, translationFile: translationFileEs, targetLocale: "es", "de", nameof(ItemRecipe.Actions));

            FirebaseRepository.PatchRecipes(recipes);
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
                    item.Labels = miror.Labels;
                }
            }

            return xmlItems;
        }

        #endregion

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

        private static void GetTranslationFromTarget<TParam>(List<TParam> items, TranslationFileDto translationFile, string targetLocale, string sourceLocale, string propertieName) where TParam : class
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

        private static void GetTranslationFromSource<TParam>(List<TParam> items, TranslationFileDto translationFile, string targetLocale, string sourceLocale, string propertieName) where TParam : class
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
    }
}
