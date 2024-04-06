using Microsoft.AspNetCore.Mvc.Filters;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using System.Security.Claims;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Controllers.ActionFillters
{
    public class JwtActionFilter : IActionFilter
    {
        protected IUserInfoProvider UserInfoProvider { get; init; }

        public JwtActionFilter(IUserInfoProvider userInfoProvider)
        {
            UserInfoProvider = userInfoProvider;
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            int.TryParse(context?.HttpContext?.User?.FindFirstValue(ClaimTypes.Upn), out var upn);
            var userKey = context?.HttpContext?.User?.FindFirstValue(MhoClaimsType.UserKey);
            UserInfoProvider.UserId = upn;
            UserInfoProvider.UserKey = userKey;
            UserInfoProvider.UserName = context?.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);
            UserInfoProvider.TownDetail = context?.HttpContext?.User?.FindFirstValue(MhoClaimsType.Town)?.FromJson<SimpleMeTownDetailDto>();
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // our code after action executes
        }
    }
}
