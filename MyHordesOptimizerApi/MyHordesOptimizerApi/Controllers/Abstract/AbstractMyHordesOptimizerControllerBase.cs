using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Providers.Interfaces;

namespace MyHordesOptimizerApi.Controllers.Abstract
{
    [ApiController]
    [Route("[controller]")]
    public class AbstractMyHordesOptimizerControllerBase : ControllerBase
    {
        protected readonly IUserKeyProvider UserKeyProvider;
        protected readonly ILogger<AbstractMyHordesOptimizerControllerBase> Logger;

        public AbstractMyHordesOptimizerControllerBase(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserKeyProvider userKeyProvider
            )
        {
            UserKeyProvider = userKeyProvider;
            Logger = logger;
        }
    }
}
