using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Authentication;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("Authentication")]
    public class MyHordesOptimizerAuthenticationController : AbstractMyHordesOptimizerControllerBase
    {
        private readonly IAuthenticationService _authenticationService;
        private readonly IMyHordesFetcherService _myHordesFetcherService;

        public MyHordesOptimizerAuthenticationController(ILogger<MyHordesFetcherController> logger,
            IAuthenticationService authenticationService,
            IMyHordesFetcherService myHordesFetcherService,
            IUserInfoProvider userKeyProvider) : base(logger, userKeyProvider)
        {
            _authenticationService = authenticationService;
            _myHordesFetcherService = myHordesFetcherService;
        }


        [HttpGet]
        [Route("Token")]
        public ActionResult<AuthenticationResponseDto> GetToken(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            UserKeyProvider.UserKey = userKey;
            var simpleMe = _myHordesFetcherService.GetSimpleMe();
            var token = _authenticationService.CreateToken(simpleMe);
            return new AuthenticationResponseDto()
            {
                SimpleMe = simpleMe,
                Token = token
            };
        }
    }
}
