using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiUnitTests.Expeditions.Fakes;
using Serilog;
using Serilog.Core;
using Serilog.Events;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.ExternalTools
{
    /// <summary>
    /// TryStart lance le job hors requête HTTP (Task.Run) : les enrichers basés sur HttpContext
    /// (MhoOrigin, MhoAddonVersion, CorrelationId) n'ont plus rien à lire une fois la requête
    /// terminée. TryStart doit donc transporter ces valeurs lui-même via LogContext.
    /// </summary>
    public class ExternalToolsUpdateJobRunnerLoggingTests
    {
        private sealed class CapturingSink : ILogEventSink
        {
            public readonly List<LogEvent> Events = new();
            public void Emit(LogEvent logEvent) => Events.Add(logEvent);
        }

        private sealed class SignalingExternalToolsService : IExternalToolsService
        {
            private readonly ILogger _logger;
            private readonly TaskCompletionSource _logged = new(TaskCreationOptions.RunContinuationsAsynchronously);

            public SignalingExternalToolsService(ILogger logger) => _logger = logger;

            public Task Logged => _logged.Task;

            public Task<UpdateResponseDto> UpdateExternalsTools(UpdateRequestDto updateRequestDto, IExternalToolsProgressSink? sink = null)
            {
                _logger.Information("job en cours");
                _logged.SetResult();
                return Task.FromResult(new UpdateResponseDto(updateRequestDto));
            }

            public List<CaseGH> UpdateGHZoneRegen(UpdateZoneRegenDto requestDto) => throw new NotSupportedException();
            public LastUpdateInfoDto UpdateCitizenBag(int townId, int userId, List<UpdateObjectDto> bag) => throw new NotSupportedException();
            public LastUpdateInfoDto UpdateCitizenHome(int townId, int userId, MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens.CitizenHomeValueDto homeDetails) => throw new NotSupportedException();
            public LastUpdateInfoDto UpdateCitizenStatus(int townId, int userId, List<string> status) => throw new NotSupportedException();
            public LastUpdateInfoDto UpdateCitizenHeroicActions(int townId, int userId, MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens.CitizenActionsHeroicValue actionHeroics) => throw new NotSupportedException();
            public LastUpdateInfoDto UpdateGhoulStatus(int townId, int userId, UpdateGhoulStatusDto request) => throw new NotSupportedException();
        }

        private static UpdateRequestDto BuildRequest() => new()
        {
            TownDetails = new UpdateTownDetailsDto { TownId = 1 },
            Map = new UpdateRequestMapDto
            {
                ToolsToUpdate = new UpdateRequestMapToolsToUpdateDetailsDto
                {
                    IsFataMorgana = "none",
                    IsBigBrothHordes = "none",
                    IsGestHordes = "none",
                    IsMyHordesOptimizer = "none"
                }
            }
        };

        [Fact]
        public async Task TryStart_transporte_origine_version_et_correlationId_jusquau_job_en_tache_de_fond()
        {
            var sink = new CapturingSink();
            var testLogger = new LoggerConfiguration()
                .Enrich.FromLogContext()
                .WriteTo.Sink(sink)
                .CreateLogger();

            var externalToolsService = new SignalingExternalToolsService(testLogger);
            var services = new ServiceCollection();
            services.AddScoped<IUserInfoProvider, FakeUserInfoProvider>();
            services.AddScoped<IExternalToolsService>(_ => externalToolsService);
            using var provider = services.BuildServiceProvider();

            var runner = new ExternalToolsUpdateJobRunner(
                provider.GetRequiredService<IServiceScopeFactory>(),
                NullLogger<ExternalToolsUpdateJobRunner>.Instance);

            runner.TryStart(userId: 42, userKey: "key", userName: "Zerah", BuildRequest(),
                mhoOrigin: "mho-addon", mhoAddonVersion: "1.2.3", correlationId: "corr-abc");

            await externalToolsService.Logged.WaitAsync(TimeSpan.FromSeconds(2));

            var jobEvent = Assert.Single(sink.Events);
            jobEvent.Properties["MhoOrigin"].ToString().Should().Contain("mho-addon");
            jobEvent.Properties["MhoAddonVersion"].ToString().Should().Contain("1.2.3");
            jobEvent.Properties["CorrelationId"].ToString().Should().Contain("corr-abc");
        }
    }
}
