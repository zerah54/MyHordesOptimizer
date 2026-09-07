using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using System;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Hubs.HubFilters
{
    public class JwtHubFilter : IHubFilter
    {
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected IDataProtector UserKeyProtector { get; init; }

        public JwtHubFilter(IUserInfoProvider userInfoProvider, IDataProtectionProvider dataProtectionProvider)
        {
            UserInfoProvider = userInfoProvider;
            UserKeyProtector = dataProtectionProvider.CreateProtector(MhoClaimsType.UserKeyProtectorPurpose);
        }

        public Task OnConnectedAsync(HubLifetimeContext context, Func<HubLifetimeContext, Task> next)
        {
            SetUserInfoProvider(context?.Context);
            return next(context);
        }

        public Task OnDisconnectedAsync(HubLifetimeContext context, Exception? exception, Func<HubLifetimeContext, Exception?, Task> next)
        {
            SetUserInfoProvider(context?.Context);
            return next(context, exception);
        }

        public ValueTask<object?> InvokeMethodAsync(HubInvocationContext invocationContext, Func<HubInvocationContext, ValueTask<object?>> next)
        {
            SetUserInfoProvider(invocationContext?.Context);
            return next(invocationContext);
        }


        // Public (et non private) uniquement pour être testable directement avec un HubCallerContext
        // de test : la surface exposée reste celle d'IHubFilter, aucun consommateur externe n'y fait
        // appel.
        public void SetUserInfoProvider(HubCallerContext? context)
        {
            int.TryParse(context?.User?.FindFirstValue(ClaimTypes.Upn), out var upn);
            var protectedUserKey = context?.User?.FindFirstValue(MhoClaimsType.UserKey);
            UserInfoProvider.UserId = upn;
            UserInfoProvider.UserKey = Unprotect(protectedUserKey);
            UserInfoProvider.UserName = context?.User?.FindFirstValue(ClaimTypes.Name);
            UserInfoProvider.TownDetail = context?.User?.FindFirstValue(MhoClaimsType.Town)?.FromJson<SimpleMeTownDetailDto>();
        }

        /// <summary>
        /// Même traitement que JwtActionFilter.Unprotect : un échec de déchiffrement dégrade
        /// proprement en "userKey absent", jamais en repli sur la valeur en clair du claim.
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
    }
}
