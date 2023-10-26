using System;
using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Exceptions;

namespace MyHordesOptimizerApi.Controllers.ActionFillters;

public class ApiExceptionFilter : ExceptionFilterAttribute
{
    protected ILogger<ApiExceptionFilter> Logger { get; private set; }

    public ApiExceptionFilter(ILogger<ApiExceptionFilter> logger)
    {
        Logger = logger;
    }

    public override void OnException(ExceptionContext context)
    {
        var exception = context.Exception;
        if (exception is MyHordesApiException)
        {
            Logger.LogInformation(exception.ToString());
            var mhException = exception as MyHordesApiException;
            var result = new ObjectResult(exception.Message);
            result.StatusCode = (int)mhException.StatusCode;
            context.Result = result;
            
        } else if (exception is WebApiException)
        {
            Logger.LogError(exception.ToString());
            var result = new ObjectResult(exception.ToString());
            result.StatusCode = (int)HttpStatusCode.FailedDependency;
            context.Result = result;
        }
        base.OnException(context);
    }
}