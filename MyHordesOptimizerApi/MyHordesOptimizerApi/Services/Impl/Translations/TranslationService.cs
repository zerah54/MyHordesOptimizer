using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;
using MyHordesOptimizerApi.Models.Translation;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Translations;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.Translations
{
    public class TranslationService : ITranslationService
    {
        protected readonly ILogger<TranslationService> Logger;
        protected readonly ITranslastionRepository TranslationRepository;

        protected Dictionary<string, List<YmlTranslationFileModel>> YmlFilesByLocale { get; private set; }
        private bool _isInit;
        private SemaphoreSlim _initLock;

        public TranslationService(ILogger<TranslationService> logger, ITranslastionRepository translationRepository)
        {
            Logger = logger;
            TranslationRepository = translationRepository;
            _initLock = new(1);
            _ = Task.Run(Init);
        }

        private async Task Init()
        {
            await _initLock.WaitAsync();
            if (_isInit)
            {
                _initLock.Release();
                return;
            }
            try
            {
                YmlFilesByLocale = await TranslationRepository.GetTranslationAsync();
                _isInit = true;
            }
            catch (Exception e)
            {
                Logger.LogError(e,"Erreur lors de la récupération des fichiers de traduction github");
            }
            _initLock.Release();
        }

        public async Task<Dictionary<string, List<YmlTranslationFileModel>>> GetTranslations()
        {
            while (_isInit != true)
            {
                await Init();
                await Task.Delay(1000);
            }
            return YmlFilesByLocale;
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

                    var translatedDeutchString = translationFile.Translations.Where(kvp => CultureInfo.InvariantCulture.CompareInfo.IndexOf(kvp.Value, sourceString, CompareOptions.IgnoreCase | CompareOptions.IgnoreNonSpace) >= 0).ToList().Select(kvp => kvp.Key);
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

                    var translatedDeutchStrings = translationFile.Translations.Keys.Where(key => CultureInfo.InvariantCulture.CompareInfo.IndexOf(key, sourceString, CompareOptions.IgnoreCase | CompareOptions.IgnoreNonSpace) >= 0).ToList().Select(key => key);
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

        public async Task ResetTranslation()
        {
            _isInit = false;
            await Init();
        }
    }
}
