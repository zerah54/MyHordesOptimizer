using System.Collections.Generic;
using System.IO;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using MyHordesOptimizerApi.Serilog;
using Serilog;
using Serilog.Core;
using Serilog.Events;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Securite
{
    /// <summary>Le corps de POST Refinement porte des seeds d'estimation : jamais dans un log (ni sur Discord).</summary>
    public class EnricherRefinementBodyTests
    {
        private sealed class ListSink : ILogEventSink
        {
            public List<LogEvent> Events { get; } = new();
            public void Emit(LogEvent logEvent) => Events.Add(logEvent);
        }

        private static LogEvent WarnDuring(string method, string path)
        {
            var context = new DefaultHttpContext();
            context.Request.Method = method;
            context.Request.Path = path;
            context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{\"candidates\":\"KdsLAA==\"}"));
            var sink = new ListSink();
            var logger = new LoggerConfiguration()
                .Enrich.With(new MyHordesOptimizerEnricher(new HttpContextAccessor { HttpContext = context }))
                .WriteTo.Sink(sink)
                .CreateLogger();
            logger.Warning("échec");
            return sink.Events[0];
        }

        [Fact]
        public void Post_refinement_body_is_never_attached() =>
            WarnDuring("POST", "/AttaqueEstimation/Refinement/16").Properties.Should().NotContainKey("Body");

        [Fact]
        public void Other_bodies_are_still_attached() =>
            WarnDuring("POST", "/AttaqueEstimation/Estimations").Properties.Should().ContainKey("Body");
    }
}
