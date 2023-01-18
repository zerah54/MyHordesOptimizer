using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
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
        public ParametersController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, IUserInfoProvider userKeyProvider, IMyHordesOptimizerParametersService parametersService) : base(logger, userKeyProvider)
        {
            ParametersService = parametersService;
        }

        [HttpGet]
        [Route("Parameters")]
        public ActionResult<IEnumerable<ParametersDto>> GetParameters()
        {
            var parameters = ParametersService.GetParameters();
            return parameters.ToList();
        }

        [HttpPost]
        [BasicAuthentication]
        [Route("Parameters")]
        public ActionResult PostParameters([FromBody] ParametersDto parameter)
        {
            ParametersService.UpdateParameter(parameter);
            return Ok();
        }
    }
}
