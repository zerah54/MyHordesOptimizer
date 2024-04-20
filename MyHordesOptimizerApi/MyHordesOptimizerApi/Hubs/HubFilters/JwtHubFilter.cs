using Microsoft.AspNetCore.Mvc.Filters;
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
        public ValueTask<object?> InvokeMethodAsync(HubInvocationContext invocationContext, Func<HubInvocationContext, ValueTask<object?>> next)
        {
            int.TryParse(invocationContext?.Context?.User?.FindFirstValue(ClaimTypes.Upn), out var upn);
            var userKey = invocationContext?.Context?.User?.FindFirstValue(MhoClaimsType.UserKey);
            UserInfoProvider.UserId = upn;
            UserInfoProvider.UserKey = userKey;
            UserInfoProvider.UserName = invocationContext?.Context?.User?.FindFirstValue(ClaimTypes.Name);
            UserInfoProvider.TownDetail = invocationContext?.Context?.User?.FindFirstValue(MhoClaimsType.Town)?.FromJson<SimpleMeTownDetailDto>();
            return next(invocationContext);
        }
    }
}
