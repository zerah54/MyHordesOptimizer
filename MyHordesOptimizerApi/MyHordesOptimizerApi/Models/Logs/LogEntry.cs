using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models.Logs
{
    public class LogEntry
    {
        public DateTimeOffset Timestamp { get; set; }
        public int ProcessId { get; set; }
        public int ThreadId { get; set; }
        public string CorrelationId { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public string SourceContext { get; set; } = string.Empty;
        public string EventId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string StackTrace { get; set; }
        public string MhoOrigin { get; set; }
        public string MhoAddonVersion { get; set; }
        public string RequestPath { get; set; }
        public string Query { get; set; }
        public string? Body { get; set; }
    }

    public class LogPageResult
    {
        public List<LogEntry> Items { get; set; } = [];
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}
