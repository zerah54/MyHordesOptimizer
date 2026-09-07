using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc.Filters;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using System.Security.Claims;
using System.Security.Cryptography;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Controllers.ActionFillters
{
    public class JwtActionFilter : IActionFilter
    {
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected IDataProtector UserKeyProtector { get; init; }

        public JwtActionFilter(IUserInfoProvider userInfoProvider, IDataProtectionProvider dataProtectionProvider)
        {
            UserInfoProvider = userInfoProvider;
            UserKeyProtector = dataProtectionProvider.CreateProtector(MhoClaimsType.UserKeyProtectorPurpose);
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            int.TryParse(context?.HttpContext?.User?.FindFirstValue(ClaimTypes.Upn), out var upn);
            var protectedUserKey = context?.HttpContext?.User?.FindFirstValue(MhoClaimsType.UserKey);
            UserInfoProvider.UserId = upn;
            UserInfoProvider.UserKey = Unprotect(protectedUserKey);
            UserInfoProvider.UserName = context?.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);
            UserInfoProvider.TownDetail = context?.HttpContext?.User?.FindFirstValue(MhoClaimsType.Town)?.FromJson<SimpleMeTownDetailDto>();
        }

        /// <summary>
        /// Déchiffre le claim MHO_UserKey. Un échec (claim absent, JWT émis avant ce fix donc encore
        /// en clair, ou clé de protection différente après un changement de secret de déploiement) est
        /// traité comme "userKey absent" : jamais de repli sur la valeur en clair du claim.
        /// </summary>
        private string Unprotect(string protectedUserKey)
        {
            if (string.IsNullOrEmpty(protectedUserKey))
            {
                return null;
            }
            try
            {
                return UserKeyProtector.Unprotect(protectedUserKey);
            }
            catch (CryptographicException)
            {
                return null;
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // our code after action executes
        }
    }
}
