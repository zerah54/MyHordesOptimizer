using Common.Core.Repository.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes.Import;
using MyHordesOptimizerApi.Dtos.MyHordes.Import.i18n;
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

        public MyHordesImportService(IMyHordesOptimizerFirebaseRepository firebaseRepository,
            IWebApiRepository webApiRepository)
        {
            FirebaseRepository = firebaseRepository;
            WebApiRepository = webApiRepository;
        }

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

                var items = Regex.Split(workingRawSkill, ",\\s*(?=([^']*'[^']*')*[^']*$)");

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
    }
}
