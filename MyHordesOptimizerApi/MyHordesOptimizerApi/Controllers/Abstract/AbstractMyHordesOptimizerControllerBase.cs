using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Providers.Interfaces;

namespace MyHordesOptimizerApi.Controllers.Abstract
{
    [ApiController]
    [Route("[controller]")]
    public class AbstractMyHordesOptimizerControllerBase : ControllerBase
    {
        protected readonly IUserInfoProvider UserInfoProvider;
        protected readonly ILogger<AbstractMyHordesOptimizerControllerBase> Logger;

        public AbstractMyHordesOptimizerControllerBase(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userInfoProvider)
        {
            UserInfoProvider = userInfoProvider;
            Logger = logger;
        }

    }
}
