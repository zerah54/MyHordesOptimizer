using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Providers.Interfaces;
using System;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.Controllers.ActionFillters
{
    public class MhoHeaderActionFilter : IActionFilter
    {
        protected readonly IMhoHeadersProvider MhoHeaderProvider;
        protected readonly IConfiguration Configuration;

        public MhoHeaderActionFilter(IMhoHeadersProvider mhoHeaderProvider, IConfiguration configuration)
        {
            MhoHeaderProvider = mhoHeaderProvider;
            Configuration = configuration;
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            var controllerActionDescription = context.ActionDescriptor as ControllerActionDescriptor;
            if (controllerActionDescription != null &&
                controllerActionDescription.MethodInfo.IsDefined(typeof(AllowExternalAccessAttribute), inherit: true))
            {
                MhoHeaderProvider.MhoOrigin = IMhoHeadersProvider.Mho_Allowed_Origin;

                return;
            }

            // 1. Récupération et stockage des en-têtes
            context.HttpContext.Request.Headers.TryGetValue(IMhoHeadersProvider.Mho_Origin_Header_Name, out var origin);
            context.HttpContext.Request.Headers.TryGetValue(IMhoHeadersProvider.Mho_Addon_Version_Header_Name, out var addon_version);

            MhoHeaderProvider.MhoOrigin = origin;
            MhoHeaderProvider.MhoAddonVersion = addon_version;

            // 2. VÉRIFICATION GLOBALE
            // Bloque si l'origine est manquante, ou si c'est l'addon mais sans sa version
            if (MhoHeaderProvider.MhoOrigin == null || (MhoHeaderProvider.MhoOrigin == IMhoHeadersProvider.Mho_Addon_Origin && MhoHeaderProvider.MhoAddonVersion == null))
            {
                context.Result = new BadRequestObjectResult("No Mho-Origin or Mho-Origin is 'addon' without Mho-Addon-Version");
                return;
            }

            // 3. PASSE-DROIT
            // Si l'origine est de confiance, on valide la requête immédiatement sans checker la suite
            if (MhoHeaderProvider.MhoOrigin == IMhoHeadersProvider.Mho_Site_Origin // Website
                || MhoHeaderProvider.MhoOrigin == IMhoHeadersProvider.Mho_Allowed_Origin // Exceptions
                || MhoHeaderProvider.MhoOrigin == IMhoHeadersProvider.Mho_ZenHordes_Origin) // ZenHordes
            {
                return;
            }

            // 4. VÉRIFICATION DE LA VERSION MINIMALE (Uniquement si configurée)
            var controllerName = context.Controller.GetType().Name;
            var methodName = controllerActionDescription?.ActionName;
            var expectedAddonVersion = Configuration.GetValue<string>($"MhoVersionControl:{controllerName}:{methodName}");

            if (expectedAddonVersion != null)
            {
                try
                {
                    var incomingAddonVersionMatch = Regex.Matches(addon_version, @"\d+");
                    if (incomingAddonVersionMatch.Count != 3)
                    {
                        context.Result = new BadRequestObjectResult($"Mho-Addon-Version should contains 3 digits. Found {addon_version} for Controller {controllerName} and method {methodName}");
                        return;
                    }

                    var incomingVersionVersion = new Version(addon_version);
                    var expectedVersionVersion = new Version(expectedAddonVersion);

                    var result = expectedVersionVersion.CompareTo(incomingVersionVersion);
                    if (result > 0)
                    {
                        context.Result = new BadRequestObjectResult($"Incoming version {addon_version} is too low. Expected {expectedAddonVersion} for Controller {controllerName} and method {methodName}");
                        return;
                    }
                }
                catch (Exception e)
                {
                    context.Result = new BadRequestObjectResult($"Error while verifying version (incoming : {addon_version}, expected {expectedAddonVersion}) for Controller {controllerName} and method {methodName} : {e.ToString()}");
                }
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // our code after action executes
        }

    }
}
