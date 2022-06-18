using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordes.Import;
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
        public ActionResult ImportHeroSkill(ImportHeroSkillRequestDto request)
        {
            if (string.IsNullOrEmpty(request.HeroSkill))
            {
                return BadRequest($"{nameof(request.HeroSkill)} is required");
            }
            if (string.IsNullOrEmpty(request.Fr))
            {
                return BadRequest($"{nameof(request.Fr)} is required");
            }
            if (string.IsNullOrEmpty(request.En))
            {
                return BadRequest($"{nameof(request.En)} is required");
            }
            if (string.IsNullOrEmpty(request.Es))
            {
                return BadRequest($"{nameof(request.Es)} is required");
            }
            MyHordesImportService.ImportHeroSkill(request);
            return Ok();
        }

        [HttpPost]
        [Route("Items")]
        public async Task<ActionResult> ImportItems(string userKey)
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
