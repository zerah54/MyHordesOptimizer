using Common.Core.Repository.Interfaces;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.Gitlab;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;
using MyHordesOptimizerApi.Models.Translation;
using MyHordesOptimizerApi.Services.Interfaces.Translations;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using YamlDotNet.Serialization;

namespace MyHordesOptimizerApi.Services.Impl.Translations
{
    public class TranslationService : ITranslationService
    {
        protected readonly IWebApiRepository WebApiRepository;
        protected readonly IMyHordesTranslationsConfiguration MyHordesTranslationsConfiguration;

        protected Dictionary<string, List<YmlTranslationFileModel>> YmlFilesByLocale { get; private set; }

        public TranslationService(IWebApiRepository webApiRepository)
        {
            WebApiRepository = webApiRepository;
            var ymlDeserializer = new DeserializerBuilder().Build();
            YmlFilesByLocale = new Dictionary<string, List<YmlTranslationFileModel>>();
            var gitlabFiles = WebApiRepository.Get<List<GitlabTreeResult>>("https://gitlab.com/api/v4/projects/17840758/repository/tree?path=translations&per_page=100");
            foreach (var file in gitlabFiles)
            {
                if (file.Name.EndsWith(".yml"))
                {
                    var ymlDatas = WebApiRepository.Get(url: $"https://gitlab.com/api/v4/projects/17840758/repository/files/{HttpUtility.UrlEncode(file.Path)}/raw").Content.ReadAsStringAsync().Result;
                    var translationFile = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlDatas);
                    var fileLocale = file.Name.Split(".")[1];
                    if (YmlFilesByLocale.TryGetValue(fileLocale, out var files))
                    {
                        files.Add(new YmlTranslationFileModel()
                        {
                            Name = file.Name,
                            Translations = translationFile,
                            DestinationLocale = fileLocale
                        });
                    }
                    else
                    {
                        YmlFilesByLocale.Add(fileLocale, new List<YmlTranslationFileModel>() { new YmlTranslationFileModel()
                        {
                            Name = file.Name,
                            Translations = translationFile,
                            DestinationLocale = fileLocale
                        }});
                    }
                }
            }
        }

        /// <summary>
        /// Permet de traduire du text dans sa langue vers l'ensemble des autres langue²
        /// </summary>
        /// <param name="locale">Langue utlisé pour sourceString</param>
        /// <param name="sourceString"></param>
        /// <returns></returns>
        public TranslationResultDto GetTranslation(string locale, string sourceString)
        {
            var result = new TranslationResultDto();
            if (locale != "de")
            {
                foreach (var translationFile in YmlFilesByLocale[locale])
                {
                    var isExactMatch = false;

                    var translatedDeutchString = translationFile.Translations.Where(kvp => kvp.Value.ToLower().IndexOf(sourceString.ToLower()) >= 0).ToList().Select(kvp => kvp.Key);
                    var exactString = translationFile.Translations.Where(kvp => kvp.Value.ToLower() == sourceString.ToLower()).FirstOrDefault().Key;
                    if (exactString != null)
                    {
                        translatedDeutchString = new List<string>() { exactString };
                        isExactMatch = true;
                    }

                    foreach (var deutchString in translatedDeutchString)
                    {
                        var nameWithoutYml = translationFile.Name.Substring(0, translationFile.Name.LastIndexOf(".")); // Remove .yml
                        var nameWithoutLocal = nameWithoutYml.Substring(0, nameWithoutYml.LastIndexOf(".")); // Puis .{locale}
                        var file = YmlFilesByLocale["fr"].FirstOrDefault(x => x.Name == $"{nameWithoutLocal}.fr.yml");
                        var translatedFrenchStrings = new List<string>() { file.Translations[deutchString] };

                        file = YmlFilesByLocale["es"].FirstOrDefault(x => x.Name == $"{nameWithoutLocal}.es.yml");
                        var translatedSpanishStrings = new List<string>() { file.Translations[deutchString] };

                        file = YmlFilesByLocale["en"].FirstOrDefault(x => x.Name == $"{nameWithoutLocal}.en.yml");
                        var translatedEnglishStrings = new List<string>() { file.Translations[deutchString] };

                        result.AddTranslation(de: deutchString, context: nameWithoutLocal, isExactMatch: isExactMatch, fr: translatedFrenchStrings, es: translatedSpanishStrings, en: translatedEnglishStrings);
                    }
                }
            }
            else
            {
                foreach (var translationFile in YmlFilesByLocale[locale])
                {
                    var isExactMatch = false;

                    var translatedDeutchStrings = translationFile.Translations.Keys.Where(key => key.ToLower().IndexOf(sourceString.ToLower()) >= 0).ToList().Select(key => key);
                    var exactString = translationFile.Translations.Where(kvp => kvp.Value.ToLower() == sourceString.ToLower()).FirstOrDefault().Key;
                    if (exactString != null)
                    {
                        translatedDeutchStrings = new List<string>() { exactString };
                        isExactMatch = true;
                    }
                    foreach (var deutchString in translatedDeutchStrings)
                    {
                        var nameWithoutYml = translationFile.Name.Substring(0, translationFile.Name.LastIndexOf(".")); // Remove .yml
                        var nameWithoutLocal = nameWithoutYml.Substring(0, nameWithoutYml.LastIndexOf(".")); // Puis .{locale}
                        var file = YmlFilesByLocale["fr"].FirstOrDefault(x => x.Name == $"{nameWithoutLocal}.fr.yml");
                        var translatedFrenchStrings = new List<string>() { file.Translations[deutchString] };

                        file = YmlFilesByLocale["es"].FirstOrDefault(x => x.Name == $"{nameWithoutLocal}.es.yml");
                        var translatedSpanishStrings = new List<string>() { file.Translations[deutchString] };

                        file = YmlFilesByLocale["en"].FirstOrDefault(x => x.Name == $"{nameWithoutLocal}.en.yml");
                        var translatedEnglishStrings = new List<string>() { file.Translations[deutchString] };

                        result.AddTranslation(de: deutchString, context: nameWithoutLocal, isExactMatch: isExactMatch, fr: translatedFrenchStrings, es: translatedSpanishStrings, en: translatedEnglishStrings);
                    }
                }
            }
            return result;
        }
    }
}
