using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Data.Glossary;
using MyHordesOptimizerApi.DiscordBot.Enums;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Search;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Controllers
{
    /// <summary>
    /// Données de la recherche globale du site qui ne tiennent pas dans les référentiels déjà servis :
    /// annuaire (joueurs, villes), cherché côté serveur, et glossaire des sigles.
    /// </summary>
    [ApiController]
    [Route("Search")]
    public class SearchController : AbstractMyHordesOptimizerControllerBase
    {
        /// <summary>Le glossaire est lu dans des fichiers livrés avec l'API : il ne change qu'au déploiement.</summary>
        private const string GlossaryCacheKey = "referentiel:glossary";
        private static readonly TimeSpan GlossaryCacheTtl = TimeSpan.FromHours(4);

        private readonly IDirectorySearchService _directorySearchService;
        private readonly IGlossaryService _glossaryService;
        private readonly IMemoryCache _cache;

        public SearchController(ILogger<SearchController> logger,
            IUserInfoProvider userInfoProvider,
            IDirectorySearchService directorySearchService,
            IGlossaryService glossaryService,
            IMemoryCache cache) : base(logger, userInfoProvider)
        {
            _directorySearchService = directorySearchService;
            _glossaryService = glossaryService;
            _cache = cache;
        }

        [HttpGet]
        [Route("directory")]
        public ActionResult<DirectorySearchResultDto> SearchDirectory([FromQuery] string? query, [FromQuery] int? limit)
        {
            return Ok(_directorySearchService.Search(query, limit));
        }

        /// <param name="locale">Code de langue du site (fr, en, de, es) ; une langue inconnue donne une liste vide.</param>
        [HttpGet]
        [Route("glossary")]
        public ActionResult<List<GlossaryEntryDto>> GetGlossary([FromQuery] string? locale)
        {
            // TryParse accepterait aussi une valeur numérique (« 1 ») : seuls les noms de langue sont admis.
            if (string.IsNullOrWhiteSpace(locale) || !locale.All(char.IsLetter) || !Enum.TryParse(locale, true, out Locales parsed))
            {
                return Ok(new List<GlossaryEntryDto>());
            }

            var glossary = _cache.GetOrCreate(GlossaryCacheKey, entry =>
            {
                entry.SetAbsoluteExpiration(GlossaryCacheTtl);
                return _glossaryService.GetGlossary();
            })!;

            var entries = glossary.TryGetValue(parsed, out var models) && models != null
                ? models
                    .Where(model => !string.IsNullOrWhiteSpace(model.Word) && !string.IsNullOrWhiteSpace(model.Definition))
                    .Select(model => new GlossaryEntryDto { Word = model.Word.Trim(), Definition = model.Definition.Trim() })
                    .ToList()
                : new List<GlossaryEntryDto>();
            return Ok(entries);
        }
    }
}
