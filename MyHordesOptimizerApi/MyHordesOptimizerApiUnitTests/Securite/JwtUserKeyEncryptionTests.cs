using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Controllers.ActionFillters;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Hubs.HubFilters;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApiUnitTests.Expeditions.Fakes;

namespace MyHordesOptimizerApiUnitTests.Securite
{
    /// <summary>
    /// G3 : le claim JWT MHO_UserKey porte la clé d'application MyHordes de l'utilisateur. Un JWT
    /// n'est signé, pas chiffré : son payload est lisible en base64 par quiconque l'intercepte. Le
    /// claim est désormais chiffré (IDataProtector, purpose MhoClaimsType.UserKeyProtectorPurpose) à
    /// l'émission (AuthenticationService.CreateToken) et déchiffré à la lecture
    /// (JwtActionFilter/JwtHubFilter). Un échec de déchiffrement dégrade en "userKey absent", jamais
    /// en repli sur la valeur en clair du claim.
    /// </summary>
    public class JwtUserKeyEncryptionTests
    {
        private const string OriginalUserKey = "clear-mh-app-key-abcdef123456";

        private sealed class FakeAuthenticationConfiguration : IAuthenticationConfiguration
        {
            public string JwtSecret => "test-jwt-secret-unit-tests-32-chars-minimum";
            public string JwtIssuer => "mho-unit-tests";
            public string JwtAudience => "mho-unit-tests-audience";
            public int JwtValideTimeInMinute => 20160;
        }

        private static AuthenticationService NewAuthenticationService(IDataProtectionProvider dataProtectionProvider)
            => new(NullLogger<AuthenticationService>.Instance, null!, new FakeAuthenticationConfiguration(), null!, dataProtectionProvider);

        private static SimpleMeDto NewMe() => new() { Id = 42, UserName = "test-user" };

        private static JwtSecurityToken DecodeJwt(string accessToken)
            => new JwtSecurityTokenHandler().ReadJwtToken(accessToken);

        [Fact]
        public void CreateToken_LeClaimUserKeyNestPlusLisibleEnClair()
        {
            var service = NewAuthenticationService(new EphemeralDataProtectionProvider());

            var token = service.CreateToken(NewMe(), OriginalUserKey);
            var jwt = DecodeJwt(token.AccessToken);
            var claimValue = jwt.Claims.First(c => c.Type == MhoClaimsType.UserKey).Value;

            claimValue.Should().NotBe(OriginalUserKey);
            claimValue.Should().NotContain(OriginalUserKey);
        }

        [Fact]
        public void JwtActionFilter_RequeteAuthentifieeNormale_ResoutUserKeyDechiffre_SansRegression()
        {
            var dataProtectionProvider = new EphemeralDataProtectionProvider();
            var authenticationService = NewAuthenticationService(dataProtectionProvider);
            var token = authenticationService.CreateToken(NewMe(), OriginalUserKey);
            var jwt = DecodeJwt(token.AccessToken);

            var userInfoProvider = new FakeUserInfoProvider();
            var filter = new JwtActionFilter(userInfoProvider, dataProtectionProvider);
            var executingContext = NewActionExecutingContext(new ClaimsPrincipal(new ClaimsIdentity(jwt.Claims)));

            filter.OnActionExecuting(executingContext);

            userInfoProvider.UserKey.Should().Be(OriginalUserKey);
        }

        [Theory]
        [InlineData("pas-du-tout-du-base64url-protege-!!")]
        [InlineData(OriginalUserKey)] // JWT émis avant ce fix : le claim porterait encore la valeur en clair.
        public void JwtActionFilter_ClaimNonDechiffrable_UserKeyAbsent_SansLever(string claimIllisible)
        {
            var userInfoProvider = new FakeUserInfoProvider();
            var filter = new JwtActionFilter(userInfoProvider, new EphemeralDataProtectionProvider());
            var principal = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(MhoClaimsType.UserKey, claimIllisible) }));
            var executingContext = NewActionExecutingContext(principal);

            var acte = () => filter.OnActionExecuting(executingContext);

            acte.Should().NotThrow();
            userInfoProvider.UserKey.Should().BeNullOrEmpty();
        }

        [Fact]
        public void JwtHubFilter_ConnexionAuthentifieeNormale_ResoutUserKeyDechiffre()
        {
            var dataProtectionProvider = new EphemeralDataProtectionProvider();
            var authenticationService = NewAuthenticationService(dataProtectionProvider);
            var token = authenticationService.CreateToken(NewMe(), OriginalUserKey);
            var jwt = DecodeJwt(token.AccessToken);

            var userInfoProvider = new FakeUserInfoProvider();
            var filter = new JwtHubFilter(userInfoProvider, dataProtectionProvider);
            var context = new FakeHubCallerContext("conn-1", new ClaimsPrincipal(new ClaimsIdentity(jwt.Claims)));

            filter.SetUserInfoProvider(context);

            userInfoProvider.UserKey.Should().Be(OriginalUserKey);
        }

        [Fact]
        public void JwtHubFilter_ClaimNonDechiffrable_UserKeyAbsent_SansLever()
        {
            var userInfoProvider = new FakeUserInfoProvider();
            var filter = new JwtHubFilter(userInfoProvider, new EphemeralDataProtectionProvider());
            var principal = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(MhoClaimsType.UserKey, OriginalUserKey) }));
            var context = new FakeHubCallerContext("conn-2", principal);

            var acte = () => filter.SetUserInfoProvider(context);

            acte.Should().NotThrow();
            userInfoProvider.UserKey.Should().BeNullOrEmpty();
        }

        private static ActionExecutingContext NewActionExecutingContext(ClaimsPrincipal user)
        {
            var httpContext = new DefaultHttpContext { User = user };
            var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
            return new ActionExecutingContext(actionContext, new List<IFilterMetadata>(), new Dictionary<string, object?>(), controller: new object());
        }
    }
}
