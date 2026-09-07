using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Caching;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ParametersController : AbstractMyHordesOptimizerControllerBase
    {
        protected IMyHordesOptimizerParametersService ParametersService { get; private set; }
        private readonly IMemoryCache _cache;

        public ParametersController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, IUserInfoProvider userKeyProvider, IMyHordesOptimizerParametersService parametersService, IMemoryCache cache) : base(logger, userKeyProvider)
        {
            ParametersService = parametersService;
            _cache = cache;
        }

        [HttpGet]
        [Route("Parameters")]
        public ActionResult<IEnumerable<ParametersDto>> GetParameters()
        {
            var parameters = _cache.GetOrCreate(ReferentialCacheKeys.Parameters,
                _ => ParametersService.GetParameters().ToList());
            return parameters;
        }

        [HttpPost]
        [BasicAuthentication]
        [Route("Parameters")]
        public ActionResult PostParameters([FromBody] ParametersDto parameter)
        {
            // Seul point d'écriture de ce référentiel (confirmé par audit). finally, pas seulement en
            // cas de succès : une écriture partiellement appliquée avant une exception ne doit pas
            // laisser le cache périmé indéfiniment (pas de TTL sur ce groupe).
            try
            {
                ParametersService.UpdateParameter(parameter);
            }
            finally
            {
                _cache.Remove(ReferentialCacheKeys.Parameters);
            }
            return Ok();
        }
    }
}
