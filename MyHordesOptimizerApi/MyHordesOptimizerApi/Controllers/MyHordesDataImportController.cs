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
    [Route("[controller]")]
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
        [Route("Items")]
        public ActionResult ImportItems(string userKey)
        {
            if (string.IsNullOrEmpty(userKey))
            {
                return BadRequest($"{nameof(userKey)} is required");
            }

            UserKeyProvider.UserKey = userKey;
            MyHordesImportService.ImportItems();
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
            UserKeyProvider.UserKey = userKey;
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
    }
}
