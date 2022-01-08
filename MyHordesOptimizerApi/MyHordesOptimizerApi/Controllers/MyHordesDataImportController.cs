using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordes.Import;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Import;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [BasicAuthentication]
    public class MyHordesDataImportController : AbstractMyHordesOptimizerControllerBase
    {
        protected IMyHordesImportService MyHordesImportService { get; private set; }
        public MyHordesDataImportController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserKeyProvider userKeyProvider,
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
        public ActionResult ImportItems(string userKey, ImportItemsRequestDto request)
        {
            if (string.IsNullOrEmpty(request.ItemsProperties))
            {
                return BadRequest($"{nameof(request.ItemsProperties)} is required");
            }
            if (string.IsNullOrEmpty(request.ItemActions))
            {
                return BadRequest($"{nameof(request.ItemActions)} is required");
            }
            if (string.IsNullOrEmpty(request.Recipes))
            {
                return BadRequest($"{nameof(request.Recipes)} is required");
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
            UserKeyProvider.UserKey = userKey;
            MyHordesImportService.ImportItems(request);
            return Ok();
        }
    }
}
