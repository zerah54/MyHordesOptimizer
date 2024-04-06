using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Authentication;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Threading.Tasks;

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
        public async Task<ActionResult<AuthenticationResponseDto>> GetToken(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            UserInfoProvider.UserKey = userKey;
            var simpleMe = await _myHordesFetcherService.GetSimpleMeAsync();
            var token = _authenticationService.CreateToken(simpleMe, userKey);
            return new AuthenticationResponseDto()
            {
                SimpleMe = simpleMe,
                Token = token
            };
        }
    }
}
