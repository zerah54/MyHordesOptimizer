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
        private const string RegexPattern_SplitOnCommaNotInBraces = ",\\s*(?=([^']*'[^']*')*[^']*$)";
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
            string pattern = "^[^\\[\\]]*" +
                       "(" +
                       "((?'Open'\\[)[^\\[\\]]*)+" +
                       "((?'Close-Open'\\])[^\\[\\]]*)+" +
                       ")*" +
                       "(?(Open)(?!))$";
            Match m = Regex.Match(heroSkillStr, pattern);
            var listOfRawSkill = new List<string>();
            var list = new List<string>();
            if (m.Success == true)
            {
                int grpCtr = 0;
                foreach (Group grp in m.Groups)
                {
                    list.Add($"   Group {grpCtr}: {grp.Value}");
                    grpCtr++;
                    int capCtr = 0;
                    foreach (Capture cap in grp.Captures)
                    {
                        list.Add($"      Capture {capCtr}: {cap.Value}");
                        capCtr++;
                        if (grpCtr == 1 + 1)
                        {
                            listOfRawSkill.Add(cap.Value);
                        }
                    }
                }
            }
            else
            {
                list.Add("Match failed.");
            }

            var listOfDictionnary = new List<Dictionary<string, string>>();

            foreach (var rawSkill in listOfRawSkill)
            {
                var workingRawSkill = rawSkill;
                workingRawSkill = workingRawSkill.TrimEnd();
                if (workingRawSkill.EndsWith(","))
                {
                    workingRawSkill = workingRawSkill.Remove(workingRawSkill.Length - 1);
                }
                workingRawSkill = workingRawSkill.Replace("[", "");
                workingRawSkill = workingRawSkill.Replace("]", "");

                var items = Regex.Split(workingRawSkill, RegexPattern_SplitOnCommaNotInBraces);

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
            var regex = new Regex("(?![^)(]*\\([^)(]*?\\)\\)),(?![^\\[]*\\])");
            var workingAllProperties = regex.Replace(strToParse, "\n");
            var hehes = workingAllProperties.Split("\n");
            foreach (var hehe in hehes)
            {
                if (!string.IsNullOrWhiteSpace(hehe))
                {
                    try
                    {
                        var splited = Regex.Split(hehe, "=>");
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
    }
}
