using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using System;

namespace MyHordesOptimizerApi.Attributes
{
    public class BasicAuthenticationAttribute : ActionFilterAttribute
    {
        public BasicAuthenticationAttribute()
        {
        }

        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var req = filterContext.HttpContext.Request;
            var auth = req.Headers["Authorization"].ToString();
            if (!String.IsNullOrEmpty(auth))
            {
                var configuration = filterContext.HttpContext.RequestServices.GetService(typeof(IConfiguration)) as IConfiguration;
                IConfigurationSection section = configuration.GetSection("Authentication");
                var username = section.GetValue<string>("Username");
                var password = section.GetValue<string>("Password");

                var cred = System.Text.Encoding.ASCII.GetString(Convert.FromBase64String(auth.Substring(6))).Split(':');
                var user = new { Name = cred[0], Pass = cred[1] };
                if (user.Name == username && user.Pass == password) return;
            }

            filterContext.Result = new UnauthorizedResult();
        }
    }
}
