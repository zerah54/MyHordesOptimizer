using Common.Core.Repository.Interfaces;
using MyHordesOptimizerApi.Dtos.Gitlab;
using MyHordesOptimizerApi.Dtos.MyHordes.Import.i18n;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;
using MyHordesOptimizerApi.Services.Interfaces.Translations;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mime;
using System.Web;

namespace MyHordesOptimizerApi.Services.Impl.Translations
{
    public class TranslationService : ITranslationService
    {
        protected readonly IWebApiRepository WebApiRepository;
        protected Dictionary<string, List<TranslationFileDto>> XlfFilesByLocale { get; private set; }

        public TranslationService(IWebApiRepository webApiRepository)
        {
            WebApiRepository = webApiRepository;
            XlfFilesByLocale = new Dictionary<string, List<TranslationFileDto>>();
            var gitlabFiles = WebApiRepository.Get<List<GitlabTreeResult>>("https://gitlab.com/api/v4/projects/17840758/repository/tree?path=translations&per_page=100");
            foreach (var file in gitlabFiles)
            {
                if (file.Name.EndsWith(".xlf"))
                {
                    var translationFile = WebApiRepository.Get<TranslationFileDto>(url: $"https://gitlab.com/api/v4/projects/17840758/repository/files/{HttpUtility.UrlEncode(file.Path)}/raw", mediaTypeOut: MediaTypeNames.Application.Xml);
                    var fileNameWithoutXlf = file.Name.Substring(0, file.Name.Length - 4); // Remove .xlf
                    var fileLocale = fileNameWithoutXlf.Substring(fileNameWithoutXlf.LastIndexOf(".") + 1, 2);
                    if (XlfFilesByLocale.TryGetValue(fileLocale, out var files))
                    {
                        files.Add(translationFile);
                    }
                    else
                    {
                        XlfFilesByLocale.Add(fileLocale, new List<TranslationFileDto>() { translationFile });
                    }
                }
            }
        }

        public TranslationResultDto GetTranslation(string locale, string sourceString)
        {
            var result = new TranslationResultDto();
            if (locale != "de")
            {
                foreach (var translationFile in XlfFilesByLocale[locale])
                {
                    var isExactMatch = false;

                    var translatedDeutchStrings = translationFile.File.Unit.Where(unit => unit.Segment.Target.ToLower().IndexOf(sourceString.ToLower()) >= 0 || sourceString.ToLower().IndexOf(unit.Segment.Target.ToLower()) >= 0).Select(translationUnit => translationUnit.Segment.Source).ToList();
                    var exactDeutchString = translationFile.File.Unit.Where(unit => unit.Segment.Target.ToLower() == sourceString.ToLower()).Select(translationUnit => translationUnit.Segment.Source).FirstOrDefault();
                    if (exactDeutchString != null)
                    {
                        translatedDeutchStrings = new List<string>() { exactDeutchString };
                        isExactMatch = true;
                    }
                    foreach (var deutchString in translatedDeutchStrings)
                    {
                        var xlfName = translationFile.File.Id.Substring(0, translationFile.File.Id.LastIndexOf(".")); // Remove .locale
                        var file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.fr")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.fr");
                        var translatedFrenchStrings = file.File.Unit.Where(unit => unit.Segment.Source.ToLower() == deutchString.ToLower()).Select(translationUnit => translationUnit.Segment.Target).ToList();

                        file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.es")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.es");
                        var translatedSpanishStrings = file.File.Unit.Where(unit => unit.Segment.Source.ToLower() == deutchString.ToLower()).Select(translationUnit => translationUnit.Segment.Target).ToList();

                        file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.en")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.en");
                        var translatedEnglishStrings = file.File.Unit.Where(unit => unit.Segment.Source.ToLower() == deutchString.ToLower()).Select(translationUnit => translationUnit.Segment.Target).ToList();

                        result.AddTranslation(de: deutchString, context: xlfName, isExactMatch: isExactMatch, fr: translatedFrenchStrings, es: translatedSpanishStrings, en: translatedEnglishStrings);
                    }
                }
            }
            else
            {
                foreach (var translationFile in XlfFilesByLocale[locale])
                {
                    var isExactMatch = false;

                    var translatedDeutchStrings = translationFile.File.Unit.Where(unit => unit.Segment.Source.ToLower().IndexOf(sourceString.ToLower()) >= 0 || sourceString.ToLower().IndexOf(unit.Segment.Source.ToLower()) >= 0).Select(translationUnit => translationUnit.Segment.Target).ToList();
                    var exactDeutchString = translationFile.File.Unit.Where(unit => unit.Segment.Source.ToLower() == sourceString.ToLower()).Select(translationUnit => translationUnit.Segment.Target).FirstOrDefault();
                    if (exactDeutchString != null)
                    {
                        translatedDeutchStrings = new List<string>() { exactDeutchString };
                        isExactMatch = true;
                    }
                    if (exactDeutchString != null)
                    {
                        translatedDeutchStrings = new List<string>() { exactDeutchString };
                        isExactMatch = true;
                    }
                    foreach (var deutchString in translatedDeutchStrings)
                    {
                        var xlfName = translationFile.File.Id.Substring(0, translationFile.File.Id.LastIndexOf(".")); // Remove .locale
                        var file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.fr")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.fr");
                        var translatedFrenchStrings = file.File.Unit.Where(unit => unit.Segment.Source.ToLower() == deutchString.ToLower()).Select(translationUnit => translationUnit.Segment.Target).ToList();

                        file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.es")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.es");
                        var translatedSpanishStrings = file.File.Unit.Where(unit => unit.Segment.Source.ToLower() == deutchString.ToLower()).Select(translationUnit => translationUnit.Segment.Target).ToList();

                        file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.en")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.en");
                        var translatedEnglishStrings = file.File.Unit.Where(unit => unit.Segment.Source.ToLower() == deutchString.ToLower()).Select(translationUnit => translationUnit.Segment.Target).ToList();

                        result.AddTranslation(de: deutchString, context: xlfName, isExactMatch: isExactMatch, fr: translatedFrenchStrings, es: translatedSpanishStrings, en: translatedEnglishStrings);
                    }
                }
            }
            return result;
        }
    }
}
