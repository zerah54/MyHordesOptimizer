using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Providers.Interfaces;
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
        public MyHordesDataImportController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userKeyProvider,
            IMyHordesImportService myHordesImportService) : base(logger, userKeyProvider)
        {
            MyHordesImportService = myHordesImportService;
        }

        [HttpPost]
        [Route("HeroSkill")]
        public async Task<ActionResult> ImportHeroSkill()
        {
            await MyHordesImportService.ImportHeroSkill();
            return Ok();
        }

        [HttpPost]
        [Route("CauseOfDeath")]
        public async Task<ActionResult> ImportCauseOfDeath()
        {
            await MyHordesImportService.ImportCauseOfDeath();
            return Ok();
        }

        [HttpPost]
        [Route("CleanUpType")]
        public ActionResult ImportCleanUpType()
        {
            MyHordesImportService.ImportCleanUpTypes();
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
            await MyHordesImportService.ImportItemsAsync();
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
            MyHordesImportService.ImportRuins();
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
            await MyHordesImportService.ImportAllAsync();
            return Ok();
        }

        [HttpPost]
        [Route("WishlistCategories")]
        public ActionResult ImportWishlistCategorie()
        {
            MyHordesImportService.ImportWishlistCategorie();
            return Ok();
        }

        [HttpPost]
        [Route("DefaultWishlist")]
        public ActionResult ImportDefaultWishlist()
        {
            MyHordesImportService.ImportDefaultWishlists();
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
            await MyHordesImportService.ImportBuildingAsync();
            return Ok();
        }
    }
}
