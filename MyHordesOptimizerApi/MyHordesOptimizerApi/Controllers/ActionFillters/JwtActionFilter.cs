using Microsoft.AspNetCore.Mvc.Filters;
using MyHordesOptimizerApi.Providers.Impl;
using MyHordesOptimizerApi.Providers.Interfaces;
using System.Security.Claims;

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
            UserInfoProvider.UserId = upn;
            UserInfoProvider.UserName = context?.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // our code after action executes
        }
    }
}
