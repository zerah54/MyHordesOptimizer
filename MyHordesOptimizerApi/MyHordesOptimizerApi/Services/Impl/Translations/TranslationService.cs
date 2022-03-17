using Common.Core.Repository.Interfaces;
using MyHordesOptimizerApi.Dtos.Gitlab;
using MyHordesOptimizerApi.Dtos.MyHordes.Import.i18n;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;
using MyHordesOptimizerApi.Services.Interfaces.Translations;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mime;
using System.Reflection;
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
                    var descriptionUnit = translationFile.File.Unit.Where(unit => unit.Segment.Target == sourceString).Select(translationUnit => translationUnit.Segment.Source).ToList();
                    result.De.AddRange(descriptionUnit);

                    if (descriptionUnit.Any())
                    {
                        var xlfName = translationFile.File.Id.Substring(0, translationFile.File.Id.LastIndexOf(".")); // Remove .locale
                        var file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.fr")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.fr");
                        var newDescriptionUnit = file.File.Unit.Where(unit => descriptionUnit.Any(x => x == unit.Segment.Source)).Select(translationUnit => translationUnit.Segment.Target).ToList();
                        result.Fr.AddRange(newDescriptionUnit);

                        file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.es")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.es");
                        newDescriptionUnit = file.File.Unit.Where(unit => descriptionUnit.Any(x => x == unit.Segment.Source)).Select(translationUnit => translationUnit.Segment.Target).ToList();
                        result.Es.AddRange(newDescriptionUnit);

                        file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.en")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.en");
                        newDescriptionUnit = file.File.Unit.Where(unit => descriptionUnit.Any(x => x == unit.Segment.Source)).Select(translationUnit => translationUnit.Segment.Target).ToList();
                        result.En.AddRange(newDescriptionUnit);
                    } 
                }
            }
            else
            {
                foreach (var translationFile in XlfFilesByLocale[locale])
                {
                    var descriptionUnit = translationFile.File.Unit.Where(unit => unit.Segment.Source == sourceString).Select(translationUnit => translationUnit.Segment.Target).ToList();
                    result.De.AddRange(descriptionUnit);

                    if (descriptionUnit.Any())
                    {
                        var xlfName = translationFile.File.Id.Substring(0, translationFile.File.Id.LastIndexOf(".")); // Remove .locale
                        var file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.fr")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.fr");
                        var newDescriptionUnit = file.File.Unit.Where(unit => descriptionUnit.Any(x => x == unit.Segment.Source)).Select(translationUnit => translationUnit.Segment.Target).ToList();
                        result.Fr.AddRange(newDescriptionUnit);

                        file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.es")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.es");
                        newDescriptionUnit = file.File.Unit.Where(unit => descriptionUnit.Any(x => x == unit.Segment.Source)).Select(translationUnit => translationUnit.Segment.Target).ToList();
                        result.Es.AddRange(newDescriptionUnit);

                        file = XlfFilesByLocale.FirstOrDefault(x => x.Value.Any(y => y.File.Id == $"{xlfName}.en")).Value.FirstOrDefault(x => x.File.Id == $"{xlfName}.en");
                        newDescriptionUnit = file.File.Unit.Where(unit => descriptionUnit.Any(x => x == unit.Segment.Source)).Select(translationUnit => translationUnit.Segment.Target).ToList();
                        result.En.AddRange(newDescriptionUnit);
                    }
                }
            }
            return result;
        }
    }
}
