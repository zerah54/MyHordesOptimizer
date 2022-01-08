using AutoMapper;
using Common.Core.Repository.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes.Import;
using MyHordesOptimizerApi.Dtos.MyHordes.Import.i18n;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Import;
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
            AddTraduction(request.Fr, heroSkills, "fr");
            AddTraduction(request.Es, heroSkills, "es");
            AddTraduction(request.En, heroSkills, "en");
            // Enregistrer dans firebase
            FirebaseRepository.PatchHeroSkill(heroSkills);
        }

        private void AddTraduction(string url, List<HeroSkill> heroSkillsWithoutTrad, string locale)
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
            var strSplitOnCommaNotInBrace = SplitOnCommaNotInBraces(heroSkillStr);
            var listOfDictionnary = new List<Dictionary<string, string>>();
            foreach (var line in strSplitOnCommaNotInBrace)
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

                var dico = new Dictionary<string, string>();
                foreach (var item in items)
                {
                    if (!string.IsNullOrWhiteSpace(item))
                    {
                        try
                        {
                            var splited = Regex.Split(item, "=>");
                            var key = splited[0].Replace("'", "").Trim();
                            var value = splited[1].Replace("'", "").Trim();
                            dico[key] = value;
                        }
                        catch (Exception)
                        {
                            // silent
                        }
                    }
                }
                listOfDictionnary.Add(dico);
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

            // Enregistrer dans firebase
            FirebaseRepository.PatchItems(items);
        }

        private static void ParseItemInfo(string strToParse, List<Item> items, string propertieName)
        {
            var strSplitOnCommaNotInBrace = SplitOnCommaNotInBraces(strToParse);
            foreach (var line in strSplitOnCommaNotInBrace)
            {
                if (!string.IsNullOrWhiteSpace(line))
                {
                    try
                    {
                        var splited = Regex.Split(line, "=>");
                        var key = splited[0].Replace("'", "").Trim(); // On récupère un truc du genre saw_tool_#00
                        key = key.Remove(key.Length - 4); // On retire le _#00
                        var properties = splited[1].Replace("[", "").Replace("]", "").Trim(); // On récupère un truc du genre 'impoundable', 'can_opener', 'box_opener'
                        var list = new List<string>();
                        foreach (var propertie in properties.Split(','))
                        {
                            list.Add(propertie.Replace("'", "").Trim());
                        }
                        typeof(Item).GetProperty(propertieName).SetValue(items.First(item => item.JsonIdName == key), list);
                    }
                    catch (Exception)
                    {
                        // silent
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

        private static string[] SplitOnCommaNotInBraces(string strToParse)
        {
            var regex = new Regex("(?![^)(]*\\([^)(]*?\\)\\)),(?![^\\[]*\\])");
            var workingAllProperties = regex.Replace(strToParse, "\n");
            var hehes = workingAllProperties.Split("\n");
            return hehes;
        }

        private static string[] SplitOnCommaNotInString(string strToParse, string englobingStr)
        {
            var regex = new Regex($"(?!\\B{englobingStr}[^{englobingStr}]*),(?![^{englobingStr}]*{englobingStr}\\B)");
            var workingAllProperties = regex.Replace(strToParse, "\n");
            var hehes = workingAllProperties.Split("\n");
            return hehes;
        }
    }
}
