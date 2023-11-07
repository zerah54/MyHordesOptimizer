using Common.Core.Repository.Interfaces;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.Gitlab;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models.Translation;
using MyHordesOptimizerApi.Services.Interfaces.Translations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using YamlDotNet.Serialization;

namespace MyHordesOptimizerApi.Services.Impl.Translations
{
    public class TranslationService : ITranslationService
    {
        protected readonly ILogger<TranslationService> Logger;
        protected readonly IWebApiRepository WebApiRepository;
        protected readonly IMyHordesTranslationsConfiguration MyHordesTranslationsConfiguration;

        protected Dictionary<string, List<YmlTranslationFileModel>> YmlFilesByLocale { get; private set; }
        private bool _isInit;
        private SemaphoreSlim _initLock;

        public TranslationService(ILogger<TranslationService> logger, IWebApiRepository webApiRepository)
        {
            Logger = logger;
            WebApiRepository = webApiRepository;
            _initLock = new(1);
            _ = Task.Run(Init);
        }

        private async Task Init()
        {
            if (_isInit)
            {
                return;
            }
            await _initLock.WaitAsync();
            try
            {
                var ymlDeserializer = new DeserializerBuilder().Build();
                YmlFilesByLocale = new Dictionary<string, List<YmlTranslationFileModel>>();
                var totalPage = 1;
                var page = 1;
                var gitlabFiles = new List<GitlabTreeResult>();
                while (page <= totalPage)
                {
                    var result = WebApiRepository.Get($"https://gitlab.com/api/v4/projects/17840758/repository/tree?path=translations&per_page=100&page={page}");
                    result.EnsureSuccessStatusCodeEnriched();
                    var content = await result.Content.ReadAsStringAsync();
                    if (result.Headers.TryGetValues("x-total-pages", out var headerValues))
                    {
                        int.TryParse(headerValues.FirstOrDefault(), out totalPage);
                    }
                    gitlabFiles.AddRange(content.FromJson<List<GitlabTreeResult>>());
                    page++;
                }
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
                _isInit = true;
            }
            catch (Exception e)
            {
                Logger.LogError("Erreur lors de la récupération des fichiers de traduction github", e.ToString());
            }
            _initLock.Release();
        }

        /// <summary>
        /// Permet de traduire du text dans sa langue vers l'ensemble des autres langue²
        /// </summary>
        /// <param name="locale">Langue utlisé pour sourceString</param>
        /// <param name="sourceString"></param>
        /// <returns></returns>
        public async Task<TranslationResultDto> GetTranslationAsync(string locale, string sourceString)
        {
            while (_isInit != true)
            {
                await Init();
                await Task.Delay(1000);
            }
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
