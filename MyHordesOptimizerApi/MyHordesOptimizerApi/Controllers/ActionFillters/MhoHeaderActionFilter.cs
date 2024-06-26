﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
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
            // our code before action executes
            context.HttpContext.Request.Headers.TryGetValue(IMhoHeadersProvider.Mho_Origin_Header_Name, out var origin);
            context.HttpContext.Request.Headers.TryGetValue(IMhoHeadersProvider.Mho_Version_Header_Name, out var version);
            MhoHeaderProvider.MhoOrigin = origin;
            MhoHeaderProvider.MhoScriptVersion = version;
            var controllerName = context.Controller.GetType().Name;
            var controllerActionDescription = context.ActionDescriptor as ControllerActionDescriptor;
            var methodName = controllerActionDescription?.ActionName;
            var expectedVersion = Configuration.GetValue<string>($"MhoVersionControl:{controllerName}:{methodName}");
            if (expectedVersion != null)
            {
                if (MhoHeaderProvider.MhoOrigin == null || (MhoHeaderProvider.MhoOrigin == IMhoHeadersProvider.Mho_Script_Origin && MhoHeaderProvider.MhoScriptVersion == null))
                {
                    context.Result = new BadRequestObjectResult("No MhoOrigin Or MhoScripOrigin without version");
                    return;
                }                
                if (MhoHeaderProvider.MhoOrigin == IMhoHeadersProvider.Mho_Site_Origin)
                {
                    return;
                }
                try
                {
                    var incomingVersionMatch = Regex.Matches(version, @"\d+");
                    var expectedVersionMatch = Regex.Matches(expectedVersion, @"\d+");
                    if(incomingVersionMatch.Count != 4)
                    {
                        context.Result = new BadRequestObjectResult($"Mho-Script-Version should contains 4 digits. Found {version} for Controller {controllerName} and method {methodName}");

                    }

                    var incomingVersionVersion = new Version(version);
                    var expectedVersionVersion = new Version(expectedVersion);
                        
                    var result = expectedVersionVersion.CompareTo(incomingVersionVersion);    
                    if (result > 0) 
                    {                            
                        context.Result = new BadRequestObjectResult($"Incoming version {version} is too low. Expected {expectedVersion} for Controller {controllerName} and method {methodName}");
                        return;
                    }
                }
                catch (Exception e)
                {
                    context.Result = new BadRequestObjectResult($"Error while verifying version (incoming : {version}, expected {expectedVersion}) for Controller {controllerName} and method {methodName} : {e.ToString()}");
                }
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // our code after action executes
        }

    }
}
