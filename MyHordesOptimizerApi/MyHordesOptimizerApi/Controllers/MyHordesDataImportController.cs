using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Caching;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("DataImport")]
    [BasicAuthentication]
    public class MyHordesDataImportController : AbstractMyHordesOptimizerControllerBase
    {
        protected IMyHordesImportService MyHordesImportService { get; private set; }
        private readonly IMemoryCache _cache;

        public MyHordesDataImportController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userKeyProvider,
            IMyHordesImportService myHordesImportService,
            IMemoryCache cache) : base(logger, userKeyProvider)
        {
            MyHordesImportService = myHordesImportService;
            _cache = cache;
        }

        [HttpPost]
        [Route("HeroSkill")]
        public async Task<ActionResult> ImportHeroSkill()
        {
            try
            {
                await MyHordesImportService.ImportHeroSkill();
            }
            finally
            {
                // Invalidation en finally, pas seulement en cas de succès : un import qui plante après
                // avoir déjà committé une partie des lignes laisserait sinon le cache périmé sans TTL
                // pour le rattraper.
                _cache.Remove(ReferentialCacheKeys.HeroSkills);
            }
            return Ok();
        }

        [HttpPost]
        [Route("CauseOfDeath")]
        public async Task<ActionResult> ImportCauseOfDeath()
        {
            try
            {
                await MyHordesImportService.ImportCauseOfDeath();
            }
            finally
            {
                _cache.Remove(ReferentialCacheKeys.CausesOfDeath);
            }
            return Ok();
        }

        [HttpPost]
        [Route("CleanUpType")]
        public ActionResult ImportCleanUpType()
        {
            try
            {
                MyHordesImportService.ImportCleanUpTypes();
            }
            finally
            {
                _cache.Remove(ReferentialCacheKeys.CleanUpTypes);
            }
            return Ok();
        }

        [HttpPost]
        [Route("Items")]
        public async Task<ActionResult> ImportItemsAsync(string userKey)
        {
            if (string.IsNullOrEmpty(userKey))
            {
                return BadRequest($"{nameof(userKey)} is required");
            }

            UserInfoProvider.UserKey = userKey;
            try
            {
                await MyHordesImportService.ImportItemsAsync();
            }
            finally
            {
                _cache.Remove(ReferentialCacheKeys.Items);
                // Les recettes sont importées avec les items (même méthode de service) : voir
                // MyHordesImportService.ImportItemsAsync.
                _cache.Remove(ReferentialCacheKeys.Recipes);
            }
            return Ok();
        }

        [HttpPost]
        [Route("Ruins")]
        public ActionResult ImportRuins(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            UserInfoProvider.UserKey = userKey;
            try
            {
                MyHordesImportService.ImportRuins();
            }
            finally
            {
                _cache.Remove(ReferentialCacheKeys.Ruins);
            }
            return Ok();
        }

        [HttpPost]
        [Route("Pictos")]
        public ActionResult ImportPictos(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            UserInfoProvider.UserKey = userKey;
            MyHordesImportService.ImportPictos();
            return Ok();
        }

        [HttpPost]
        [Route("Categories")]
        public async Task<ActionResult> ImportCategories()
        {
            await MyHordesImportService.ImportCategoriesAsync();
            return Ok();
        }


        [HttpPost]
        [Route("All")]
        public async Task<ActionResult> ImportAll(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            UserInfoProvider.UserKey = userKey;
            try
            {
                await MyHordesImportService.ImportAllAsync();
            }
            finally
            {
                // ImportAllAsync ré-exécute chaque import individuel au niveau service (voir
                // MyHordesImportService.ImportAllAsync) : toutes les clés du groupe A doivent être
                // invalidées, y compris si un import intermédiaire a échoué en cours de route.
                InvalidateAllReferentialCaches();
            }
            return Ok();
        }

        [HttpPost]
        [Route("WishlistCategories")]
        public ActionResult ImportWishlistCategorie()
        {
            try
            {
                MyHordesImportService.ImportWishlistCategorie();
            }
            finally
            {
                _cache.Remove(ReferentialCacheKeys.WishListCategories);
            }
            return Ok();
        }

        [HttpPost]
        [Route("DefaultWishlist")]
        public ActionResult ImportDefaultWishlist()
        {
            try
            {
                MyHordesImportService.ImportDefaultWishlists();
            }
            finally
            {
                _cache.Remove(ReferentialCacheKeys.WishListTemplates);
            }
            return Ok();
        }


        [HttpPost]
        [Route("Buildings")]
        public async Task<ActionResult> ImportBuildingAsync([FromQuery] string userKey)
        {
            if (string.IsNullOrEmpty(userKey))
            {
                return BadRequest($"{nameof(userKey)} is required");
            }
            UserInfoProvider.UserKey = userKey;
            try
            {
                await MyHordesImportService.ImportBuildingAsync();
            }
            finally
            {
                _cache.Remove(ReferentialCacheKeys.Buildings);
            }
            return Ok();
        }

        /// <summary>
        /// Invalide tout le groupe A (référentiels à invalidation manuelle) après un import global :
        /// <see cref="IMyHordesImportService.ImportAllAsync"/> ré-exécute chaque import individuel au
        /// niveau service, en contournant les actions ci-dessus.
        /// </summary>
        private void InvalidateAllReferentialCaches()
        {
            _cache.Remove(ReferentialCacheKeys.Items);
            _cache.Remove(ReferentialCacheKeys.Recipes);
            _cache.Remove(ReferentialCacheKeys.Ruins);
            _cache.Remove(ReferentialCacheKeys.Buildings);
            _cache.Remove(ReferentialCacheKeys.HeroSkills);
            _cache.Remove(ReferentialCacheKeys.CausesOfDeath);
            _cache.Remove(ReferentialCacheKeys.CleanUpTypes);
            _cache.Remove(ReferentialCacheKeys.WishListCategories);
            _cache.Remove(ReferentialCacheKeys.WishListTemplates);
        }

        [HttpPost]
        [Route("Jobs")]
        public async Task<ActionResult> ImportJobsAsync()
        {
            await MyHordesImportService.ImportJobsAsync();
            return Ok();
        }

        // `resume` ignore les villes déjà importées depuis le classement : sans lui, une saison
        // ancienne interrompue par le quota MyHordes repart du premier lot à chaque relance.
        [HttpPost]
        [Route("Towns")]
        public async Task<ActionResult> ImportTownsAsync([FromQuery] int? season = null, [FromQuery] bool resume = false)
        {
            await MyHordesImportService.ImportTownsAsync(season, resume);
            return Ok();
        }
    }
}
