using Microsoft.AspNetCore.Http;
using MyHordesOptimizerApi.Providers.Interfaces;
using Serilog.Core;
using Serilog.Events;
using System;
using System.IO;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.Serilog
{
    public class MyHordesOptimizerEnricher : ILogEventEnricher
    {
        protected readonly IHttpContextAccessor HttpContextAccessor;

        public MyHordesOptimizerEnricher(IHttpContextAccessor httpContextAccessor)
        {
            HttpContextAccessor = httpContextAccessor;
        }

        public void Enrich(LogEvent logEvent, ILogEventPropertyFactory factory)
        {
            if (HttpContextAccessor.HttpContext != null)
            {
                var mhoScriptVersion = HttpContextAccessor.HttpContext.Request.Headers[IMhoHeadersProvider.Mho_Version_Header_Name];
                var mhoOrigin = HttpContextAccessor.HttpContext.Request.Headers[IMhoHeadersProvider.Mho_Origin_Header_Name];
                var mhoScriptVersionProperty = factory.CreateProperty("MhoScriptVersion", mhoScriptVersion);
                var mhoOriginProperty = factory.CreateProperty("MhoOrigin", mhoOrigin);
                logEvent.AddPropertyIfAbsent(mhoScriptVersionProperty);
                logEvent.AddPropertyIfAbsent(mhoOriginProperty);

                var query = HttpContextAccessor.HttpContext.Request.QueryString;
                var queryProperty = factory.CreateProperty("Query", query);
                logEvent.AddPropertyIfAbsent(queryProperty);

                if (logEvent.Level == LogEventLevel.Warning || logEvent.Level == LogEventLevel.Error)
                {
                    try
                    {
                        var request = HttpContextAccessor.HttpContext.Request;
                        using var streamReader = new StreamReader(request.Body);
                        request.Body.Position = 0;
                        var requestBody = streamReader.ReadToEndAsync().Result;
                        request.Body.Position = 0;
                        requestBody = Regex.Replace(requestBody, @"\s+|\\n|\\r", string.Empty);
                        var bodyProperty = factory.CreateProperty("Body", requestBody);
                        logEvent.AddPropertyIfAbsent(bodyProperty);
                    }
                    catch (Exception e)
                    { 
                        // Nothing
                    }
                }
            }
        }
    }
}
