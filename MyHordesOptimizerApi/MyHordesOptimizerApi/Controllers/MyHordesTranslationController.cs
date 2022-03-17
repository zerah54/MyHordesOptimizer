using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Translations;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MyHordesTranslationController : AbstractMyHordesOptimizerControllerBase
    {
        protected ITranslationService TranslationService { get; set; }
        public MyHordesTranslationController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, 
            IUserInfoProvider userKeyProvider,
            ITranslationService translationService) : base(logger, userKeyProvider)
        {
            TranslationService = translationService;
        }

        [HttpGet]
        public ActionResult<TranslationResultDto> GetTranslation(string locale, string sourceString)
        {
            if (string.IsNullOrWhiteSpace(locale))
            {
                return BadRequest($"{nameof(locale)} cannot be empty");
            }
            if (string.IsNullOrWhiteSpace(sourceString))
            {
                return BadRequest($"{nameof(sourceString)} cannot be empty");
            }
            var translationResult = TranslationService.GetTranslation(locale, sourceString);
            return translationResult;
        }
    }
}
