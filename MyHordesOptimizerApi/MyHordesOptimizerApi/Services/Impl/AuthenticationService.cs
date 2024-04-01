using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Authentication;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using IAuthenticationService = MyHordesOptimizerApi.Services.Interfaces.IAuthenticationService;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class AuthenticationService : IAuthenticationService
    {
        protected ILogger<AuthenticationService> Logger { get; set; }
        protected IMyHordesApiRepository MyHordesJsonApiRepository { get; set; }
        protected IAuthenticationConfiguration Configuration { get; set; }
        protected IMyHordesFetcherService MyHordesFetcherService { get; set; }

        public AuthenticationService(ILogger<AuthenticationService> logger, IMyHordesApiRepository myHordesJsonApiRepository, IAuthenticationConfiguration configuration, IMyHordesFetcherService myHordesFetcherService)
        {
            Logger = logger;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            Configuration = configuration;
            MyHordesFetcherService = myHordesFetcherService;
        }

        public TokenDto CreateToken(SimpleMeDto me)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var mySecurityKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(Configuration.JwtSecret));
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                  new Claim(ClaimTypes.Upn, me.Id.ToString()),
                  new Claim(ClaimTypes.Name, me.UserName),
                  new Claim(MhoClaimsType.Town, me.TownDetails.ToJson())
                }),
                Expires = DateTime.UtcNow.AddMinutes(Configuration.JwtValideTimeInMinute),
                Issuer = Configuration.JwtIssuer,
                Audience = Configuration.JwtAudience,
                SigningCredentials = new SigningCredentials(mySecurityKey, SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwt = tokenHandler.WriteToken(token);
            var dto = new TokenDto()
            {
                AccessToken = jwt,
                ValidFrom = token.ValidFrom,
                ValidTo = token.ValidTo
            };
            return dto;
        }
    }

    public class MhoClaimsType
    {
        public const string Town = "MHO_Town";
    }
}
