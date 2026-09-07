using Microsoft.AspNetCore.DataProtection;
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

        // Purpose dédié (voir MhoClaimsType.UserKeyProtectorPurpose) : le claim MHO_UserKey porte la
        // clé d'application MyHordes de l'utilisateur, en clair sinon décodable par quiconque
        // intercepte le JWT (JWT = signé, pas chiffré). IDataProtector.Protect/Unprotect chiffrent ce
        // claim indépendamment d'autres usages futurs de Data Protection dans ce projet.
        protected IDataProtector UserKeyProtector { get; set; }

        public AuthenticationService(ILogger<AuthenticationService> logger, IMyHordesApiRepository myHordesJsonApiRepository, IAuthenticationConfiguration configuration, IMyHordesFetcherService myHordesFetcherService, IDataProtectionProvider dataProtectionProvider)
        {
            Logger = logger;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            Configuration = configuration;
            MyHordesFetcherService = myHordesFetcherService;
            UserKeyProtector = dataProtectionProvider.CreateProtector(MhoClaimsType.UserKeyProtectorPurpose);
        }

        public TokenDto CreateToken(SimpleMeDto me, string userKey)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var mySecurityKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(Configuration.JwtSecret));
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                  new Claim(ClaimTypes.Upn, me.Id.ToString()),
                  new Claim(ClaimTypes.Name, me.UserName),
                  new Claim(MhoClaimsType.Town, me.TownDetails.ToJson()),
                  new Claim(MhoClaimsType.UserKey, UserKeyProtector.Protect(userKey))
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
        public const string UserKey = "MHO_UserKey";

        // Versionné (".v1") pour pouvoir faire évoluer ce chiffrement indépendamment d'autres
        // usages futurs de Data Protection dans ce projet.
        public const string UserKeyProtectorPurpose = "MHO.JwtUserKey.v1";
    }
}
