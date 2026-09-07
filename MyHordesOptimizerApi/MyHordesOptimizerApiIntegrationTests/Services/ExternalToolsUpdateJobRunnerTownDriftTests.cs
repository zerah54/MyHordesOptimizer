using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.ExternalTools;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Fakes;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// I2 (revue finale du chantier cycle de vie de session) : TryStart ne recopiait pas TownDetail
    /// dans le scope de fond créé par RunAsync, donc UserInfoProvider.TownDetail y valait TOUJOURS
    /// null. La détection de dérive (me.MapId.Value != TownDetail?.TownId) était donc TOUJOURS vraie,
    /// et un token réémis à quasiment chaque clic sur « MAJ outils externes », pas seulement en cas de
    /// dérive réelle — ce qui amplifie directement C1 (plus le token circule via Status, plus la
    /// fenêtre d'exposition est grande). Fix : TryStart capture TownDetail (déjà peuplé par
    /// JwtActionFilter dans le scope de requête) et le repose sur le scope de fond.
    /// </summary>
    public class ExternalToolsUpdateJobRunnerTownDriftTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsUpdateJobRunnerTownDriftTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private static UpdateRequestDto BuildRequest(int townId) => new()
        {
            TownDetails = new UpdateTownDetailsDto { TownId = townId, TownX = 0, TownY = 0, IsChaos = false },
            Map = new UpdateRequestMapDto
            {
                ToolsToUpdate = new UpdateRequestMapToolsToUpdateDetailsDto
                {
                    IsMyHordesOptimizer = "api",
                    IsGestHordes = "none",
                    IsFataMorgana = "none",
                    IsBigBrothHordes = "none"
                }
            }
        };

        private async Task<ExternalToolsUpdateJobState> RunJobAsync(int mapId, int userId, string userName, SimpleMeTownDetailDto claimTownDetail)
        {
            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => new FixedMapIdMyHordesApiRepository(mapId, userId, userName));
                });
            });

            var scope = factory.Services.CreateScope();
            var runner = scope.ServiceProvider.GetRequiredService<ExternalToolsUpdateJobRunner>();

            var state = runner.TryStart(userId, "test-user-key-" + userId, userName, claimTownDetail, BuildRequest(mapId),
                mhoOrigin: "mho-addon", mhoAddonVersion: "1.2.3", correlationId: "corr-" + userId);
            state.Should().NotBeNull();

            var finalState = state;
            var started = DateTime.UtcNow;
            while (finalState.IsRunning && DateTime.UtcNow - started < TimeSpan.FromSeconds(5))
            {
                await Task.Delay(50);
                finalState = runner.GetState(userId);
            }
            return finalState;
        }

        [Fact]
        public async Task TryStart_TownIdFraisIdentiqueAuClaim_NeReemetAucunToken()
        {
            var random = new Random();
            var mapId = random.Next(1, int.MaxValue);
            var userId = random.Next(1, int.MaxValue);
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);

            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Towns.Add(new Town { IdTown = mapId, MapId = mapId, Name = "test-town-" + suffix, IsFinished = false });
                context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
                context.SaveChanges();
            }

            var finalState = await RunJobAsync(mapId, userId, "test-user-" + suffix, new SimpleMeTownDetailDto { TownId = mapId });

            finalState.RenewedToken.Should().BeNull("le claim JWT pointe déjà vers la ville fraîche : pas de dérive, donc pas de réémission");
        }

        /// <summary>
        /// Contre-épreuve : sans elle, un bug qui réémettrait TOUJOURS un token (celui d'origine)
        /// ferait aussi passer un premier test qui se contenterait de vérifier « pas de token » dans
        /// un cas où il ne devrait effectivement pas y en avoir.
        /// </summary>
        [Fact]
        public async Task TryStart_TownIdFraisDifferentDuClaim_ReemetUnToken()
        {
            var random = new Random();
            var mapId = random.Next(1, int.MaxValue);
            var oldTownId = random.Next(1, int.MaxValue);
            var userId = random.Next(1, int.MaxValue);
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);

            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Towns.Add(new Town { IdTown = mapId, MapId = mapId, Name = "test-town-" + suffix, IsFinished = false });
                context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
                context.SaveChanges();
            }

            var finalState = await RunJobAsync(mapId, userId, "test-user-" + suffix, new SimpleMeTownDetailDto { TownId = oldTownId });

            finalState.RenewedToken.Should().NotBeNull("le claim JWT pointe vers l'ancienne ville : dérive réelle, réémission attendue");
        }
    }
}
