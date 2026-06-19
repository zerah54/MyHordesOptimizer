using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Models.Logs;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class AdminService
    {
        private static readonly Regex LogLineRegex = new(
            @"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+-]\d{2}:\d{2}) <(\d+) - (\d+)>\s+(\S*)\s+\[(\w+)\] ==([^=]*) - ([^=]*)== \[([^\]]*)\] \[([^\]]*)\] \[([^\]]*)\] (.*)$",
            RegexOptions.Compiled
        );

        private readonly string _logBasePath;

        public AdminService(IConfiguration configuration)
        {
            _logBasePath = configuration["Serilog:WriteTo:0:Args:path"]
                ?? throw new InvalidOperationException("Serilog:WriteTo:0:Args:path is not configured.");
        }

        public List<DateOnly> GetAvailableDates()
        {
            var dir = Path.GetDirectoryName(_logBasePath)!;
            var baseName = Path.GetFileNameWithoutExtension(_logBasePath);
            var dates = new HashSet<DateOnly>();

            if (!Directory.Exists(dir))
                return [];

            foreach (var file in Directory.GetFiles(dir, $"{baseName}*.log"))
            {
                var match = Regex.Match(Path.GetFileNameWithoutExtension(file), @"(\d{8})");
                if (match.Success && DateOnly.TryParseExact(match.Groups[1].Value, "yyyyMMdd", out var date))
                    dates.Add(date);
            }

            var result = new List<DateOnly>(dates);
            result.Sort((a, b) => b.CompareTo(a));
            return result;
        }

        public LogPageResult GetLogs(
            DateOnly date,
            int page,
            int pageSize,
            string? level = null,
            string? correlationId = null,
            string? search = null)
        {
            var all = ParseLogsForDate(date);

            if (!string.IsNullOrWhiteSpace(level))
                all = all.FindAll(e => e.Level.Equals(level, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrWhiteSpace(correlationId))
                all = all.FindAll(e => e.CorrelationId.Contains(correlationId, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrWhiteSpace(search))
                all = all.FindAll(e =>
                    e.Message.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    e.SourceContext.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    (e.RequestPath != null && e.RequestPath.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                    (e.Body != null && e.Body.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                    (e.StackTrace != null && e.StackTrace.Contains(search, StringComparison.OrdinalIgnoreCase)));

            var total = all.Count;
            var skip = (page - 1) * pageSize;
            var items = skip >= total
                ? []
                : all.GetRange(skip, Math.Min(pageSize, total - skip));

            return new LogPageResult { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
        }

        private List<LogEntry> ParseLogsForDate(DateOnly date)
        {
            var dir = Path.GetDirectoryName(_logBasePath)!;
            var baseName = Path.GetFileNameWithoutExtension(_logBasePath);
            var dateStr = date.ToString("yyyyMMdd");

            var files = Directory.GetFiles(dir, $"{baseName}{dateStr}*.log");
            Array.Sort(files);

            var entries = new List<LogEntry>();

            foreach (var file in files)
            {
                using var stream = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                using var reader = new StreamReader(stream, Encoding.UTF8);

                LogEntry? current = null;
                var stackBuilder = new StringBuilder();
                string? line;

                while ((line = reader.ReadLine()) != null)
                {
                    var parsed = TryParseLine(line);
                    if (parsed != null)
                    {
                        FlushEntry(ref current, stackBuilder, entries);
                        current = parsed;
                    }
                    else if (current != null)
                    {
                        stackBuilder.AppendLine(line);
                    }
                }

                FlushEntry(ref current, stackBuilder, entries);
            }

            return entries;
        }

        private static LogEntry? TryParseLine(string line)
        {
            var match = LogLineRegex.Match(line);
            if (!match.Success) return null;

            var entry = new LogEntry
            {
                Timestamp = DateTimeOffset.Parse(match.Groups[1].Value),
                ProcessId = int.TryParse(match.Groups[2].Value, out var pid) ? pid : 0,
                ThreadId = int.TryParse(match.Groups[3].Value, out var tid) ? tid : 0,
                CorrelationId = match.Groups[4].Value,
                Level = match.Groups[5].Value,
                MhoOrigin = NullIfEmpty(CleanHeaderValue(match.Groups[6].Value.Trim())),
                MhoAddonVersion = NullIfEmpty(CleanHeaderValue(match.Groups[7].Value.Trim())),
                SourceContext = match.Groups[9].Value,
                EventId = match.Groups[10].Value,
                Message = match.Groups[11].Value
            };
            ParseRequestSection(match.Groups[8].Value, entry);
            return entry;
        }

        private static void ParseRequestSection(string section, LogEntry entry)
        {
            var dashIdx = section.IndexOf(" - ", StringComparison.Ordinal);
            if (dashIdx < 0) return;

            var pathAndQuery = section[..dashIdx];
            var body = section[(dashIdx + 3)..];

            if (!string.IsNullOrWhiteSpace(pathAndQuery))
            {
                var qIdx = pathAndQuery.IndexOf('?');
                if (qIdx >= 0)
                {
                    entry.RequestPath = pathAndQuery[..qIdx];
                    entry.Query = pathAndQuery[qIdx..];
                }
                else
                {
                    entry.RequestPath = pathAndQuery;
                }
            }

            entry.Body = NullIfEmpty(body);
        }

        private static string? NullIfEmpty(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value;

        private static void FlushEntry(ref LogEntry? entry, StringBuilder stackBuilder, List<LogEntry> entries)
        {
            if (entry == null) return;
            if (stackBuilder.Length > 0)
            {
                entry.StackTrace = stackBuilder.ToString().TrimEnd();
                stackBuilder.Clear();
            }
            entries.Add(entry);
            entry = null;
        }

        private static string CleanHeaderValue(string value) => value.StartsWith("[\"") && value.EndsWith("\"]") ? value[2..^2] : value;
    }
}
