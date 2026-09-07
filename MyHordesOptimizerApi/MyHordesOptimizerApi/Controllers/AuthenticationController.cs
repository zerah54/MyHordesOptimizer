using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Authentication;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Net;
using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("Authentication")]
    public class AuthenticationController : AbstractMyHordesOptimizerControllerBase
    {
        private readonly IAuthenticationService _authenticationService;
        private readonly IMyHordesFetcherService _myHordesFetcherService;

        public AuthenticationController(ILogger<FetcherController> logger,
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
            SimpleMeDto simpleMe;
            try
            {
                simpleMe = await _myHordesFetcherService.GetSimpleMeAsync();
            }
            catch (MyHordesApiException e) when (e.StatusCode is HttpStatusCode.TooManyRequests or HttpStatusCode.ServiceUnavailable)
            {
                // Résolution SERVEUR uniquement, depuis le userKey SOUMIS dans cette requête (jamais
                // une valeur fournie par le client — voir C2, revue finale du chantier). Rien en cache
                // pour ce userKey (premier appel de la session, ou clé jamais vue) : rien à servir.
                simpleMe = _myHordesFetcherService.BuildSimpleMeFromDbByUserKey(userKey);
                if (simpleMe == null)
                {
                    throw;
                }
            }
            var token = _authenticationService.CreateToken(simpleMe, userKey);
            return new AuthenticationResponseDto()
            {
                SimpleMe = simpleMe,
                Token = token
            };
        }

        [HttpPost]
        [Route("ExternalLogin")]
        [AllowExternalAccess]
        public async Task<ActionResult<AuthenticationResponseDto>> PostExternalLogin([FromForm] string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return BadRequest($"{nameof(key)} cannot be empty");
            }
            
            return Redirect($"https://myhordes-optimizer.web.app/login?token={key}");
        }
    }
}
