using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Providers.Interfaces;

namespace MyHordesOptimizerApi.Controllers.Abstract
{
    [ApiController]
    [Route("[controller]")]
    public class AbstractMyHordesOptimizerControllerBase : ControllerBase
    {
        protected readonly IUserInfoProvider UserKeyProvider;
        protected readonly ILogger<AbstractMyHordesOptimizerControllerBase> Logger;

        public AbstractMyHordesOptimizerControllerBase(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userKeyProvider
            )
        {
            UserKeyProvider = userKeyProvider;
            Logger = logger;
        }
    }
}
