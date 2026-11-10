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

        protected Dictionary<string, List<YmlTranslationFileModel>> YmlFilesByLocale { get; private set; } = null!;
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

        /// <summary>Nombre de tentatives avant d'abandonner, et délai qui les sépare.</summary>
        /// <remarks>
        /// GitLab répond en quelques secondes quand il répond ; au-delà de ces essais, il est
        /// indisponible et attendre davantage ne changera rien.
        /// </remarks>
        private const int TentativesMax = 5;
        private static readonly TimeSpan DelaiEntreTentatives = TimeSpan.FromSeconds(2);

        /// <summary>
        /// Les fichiers de traduction, une fois chargés.
        /// </summary>
        /// <remarks>
        /// BORNÉE, contrairement à la version précédente : elle bouclait indéfiniment tant que
        /// l'initialisation échouait, à raison d'un essai par seconde et sans limite. Si GitLab
        /// restait indisponible, l'appel ne rendait JAMAIS la main — et <c>ImportItemsAsync</c>,
        /// <c>ImportCauseOfDeath</c>, <c>ImportCategoriesAsync</c> et <c>ImportHeroSkill</c> en
        /// dépendent tous. Constaté 3 fois le 2026-07-27, rattrapé au deuxième essai à chaque
        /// fois : la boucle n'a jamais tourné longtemps, mais rien ne l'en empêchait.
        /// </remarks>
        /// <exception cref="InvalidOperationException">
        /// Après épuisement des tentatives. Un import qui échoue bruyamment vaut mieux qu'un
        /// import qui ne répond plus.
        /// </exception>
        public async Task<Dictionary<string, List<YmlTranslationFileModel>>> GetTranslations()
        {
            for (var tentative = 1; !_isInit && tentative <= TentativesMax; tentative++)
            {
                await Init();
                if (_isInit)
                {
                    break;
                }
                Logger.LogWarning("Traductions indisponibles (tentative {Tentative}/{Max}), nouvelle tentative dans {Delai} s.",
                    tentative, TentativesMax, DelaiEntreTentatives.TotalSeconds);
                await Task.Delay(DelaiEntreTentatives);
            }

            if (!_isInit)
            {
                throw new InvalidOperationException(
                    $"Fichiers de traduction indisponibles après {TentativesMax} tentatives. " +
                    "L'appel est abandonné plutôt que de bloquer indéfiniment.");
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
            // Même attente bornée que les imports, plutôt que la boucle infinie qui vivait ici :
            // `while (_isInit != true) { await Init(); await Task.Delay(1000); }` réessayait une
            // fois par seconde, sans limite, et ne rendait JAMAIS la main tant que les fichiers de
            // traduction restaient indisponibles. `GetTranslations` abandonne au bout de cinq
            // tentatives : l'appel ressort alors en erreur, ce qui vaut mieux qu'une requête
            // suspendue. Au retour, `YmlFilesByLocale` est renseigné.
            await GetTranslations();

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
                        result.AddTranslation(de: deutchString, context: nameWithoutLocal, isExactMatch: isExactMatch,
                            fr: FindInSiblingFile("fr", nameWithoutLocal, deutchString),
                            es: FindInSiblingFile("es", nameWithoutLocal, deutchString),
                            en: FindInSiblingFile("en", nameWithoutLocal, deutchString));
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
                        result.AddTranslation(de: deutchString, context: nameWithoutLocal, isExactMatch: isExactMatch,
                            fr: FindInSiblingFile("fr", nameWithoutLocal, deutchString),
                            es: FindInSiblingFile("es", nameWithoutLocal, deutchString),
                            en: FindInSiblingFile("en", nameWithoutLocal, deutchString));
                    }
                }
            }
            return result;
        }

        /// <summary>
        /// Traduction d'une clé allemande dans le fichier homologue d'une langue ; vide si le fichier ou la clé manque
        /// (une nouvelle chaîne allemande arrive dans le dépôt avant d'être traduite).
        /// </summary>
        private List<string> FindInSiblingFile(string locale, string nameWithoutLocal, string deutchString)
        {
            var file = YmlFilesByLocale.GetValueOrDefault(locale)?.FirstOrDefault(x => x.Name == $"{nameWithoutLocal}.{locale}.yml");
            return file != null && file.Translations.TryGetValue(deutchString, out var translation)
                ? new List<string> { translation }
                : new List<string>();
        }

        public async Task ResetTranslation()
        {
            _isInit = false;
            await Init();
        }
    }
}
