using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Providers.Interfaces;
using System.Linq;

namespace MyHordesOptimizerApi.Attributes
{
    /// <summary>
    /// Restricts access to users whose ID is listed in Admin:UserIds in appsettings.
    /// Must be used alongside [Authorize] — assumes the JWT is already validated.
    /// </summary>
    public class AdminOnlyAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var configuration = context.HttpContext.RequestServices.GetService(typeof(IConfiguration)) as IConfiguration;
            var userInfoProvider = context.HttpContext.RequestServices.GetService(typeof(IUserInfoProvider)) as IUserInfoProvider;

            var adminIds = configuration?
                .GetSection("Admin:UserIds")
                .Get<int[]>() ?? [];

            if (userInfoProvider == null || !adminIds.Contains(userInfoProvider.UserId))
            {
                context.Result = new ForbidResult();
                return;
            }

            base.OnActionExecuting(context);
        }
    }
}
