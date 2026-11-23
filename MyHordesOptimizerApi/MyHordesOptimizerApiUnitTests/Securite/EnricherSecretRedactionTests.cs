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
    /// <summary>La query et le corps attachés à chaque log ne portent plus la clé joueur en clair.</summary>
    public class EnricherSecretRedactionTests
    {
        private sealed class ListSink : ILogEventSink
        {
            public List<LogEvent> Events { get; } = new();
            public void Emit(LogEvent logEvent) => Events.Add(logEvent);
        }

        private static LogEvent WarnDuring(string query, string body)
        {
            var context = new DefaultHttpContext();
            context.Request.Method = "POST";
            context.Request.Path = "/externaltools/update/start";
            context.Request.QueryString = new QueryString(query);
            context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(body));
            var sink = new ListSink();
            var logger = new LoggerConfiguration()
                .Enrich.With(new MyHordesOptimizerEnricher(new HttpContextAccessor { HttpContext = context }))
                .WriteTo.Sink(sink)
                .CreateLogger();
            logger.Warning("échec");
            return sink.Events[0];
        }

        [Fact]
        public void La_query_attachee_masque_la_cle_joueur()
        {
            var logEvent = WarnDuring("?userKey=QUERYSECRET&userId=21786", "{}");

            var query = logEvent.Properties["Query"].ToString();
            query.Should().NotContain("QUERYSECRET");
            query.Should().Contain("userId=21786");
        }

        [Fact]
        public void Le_corps_attache_masque_la_cle_joueur()
        {
            var logEvent = WarnDuring("", "{\"userKey\":\"BODYSECRET\",\"townId\":7772}");

            var body = logEvent.Properties["Body"].ToString();
            body.Should().NotContain("BODYSECRET");
            body.Should().Contain("7772");
        }
    }
}
