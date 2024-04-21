using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Hubs.HubFilters
{
    public class JwtHubFilter : IHubFilter
    {
        protected IUserInfoProvider UserInfoProvider { get; init; }

        public JwtHubFilter(IUserInfoProvider userInfoProvider)
        {
            UserInfoProvider = userInfoProvider;
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


        private void SetUserInfoProvider(HubCallerContext? context)
        {
            int.TryParse(context?.User?.FindFirstValue(ClaimTypes.Upn), out var upn);
            var userKey = context?.User?.FindFirstValue(MhoClaimsType.UserKey);
            UserInfoProvider.UserId = upn;
            UserInfoProvider.UserKey = userKey;
            UserInfoProvider.UserName = context?.User?.FindFirstValue(ClaimTypes.Name);
            UserInfoProvider.TownDetail = context?.User?.FindFirstValue(MhoClaimsType.Town)?.FromJson<SimpleMeTownDetailDto>();
        }
    }
}
