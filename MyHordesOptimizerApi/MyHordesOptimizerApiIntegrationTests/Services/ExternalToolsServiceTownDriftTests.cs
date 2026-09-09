using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Fakes;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExternalToolsServiceTownDriftTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsServiceTownDriftTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task UpdateExternalsTools_TownIdFraisDifferentDuClaim_RenvoieUnTokenRenouvele()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var oldTownId = random.Next(1, int.MaxValue);
            var newTownId = random.Next(1, int.MaxValue);
            var userId = random.Next(1, int.MaxValue);

            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Towns.Add(new Town { IdTown = newTownId, MapId = newTownId, Name = "test-town-" + suffix, IsFinished = false });
                context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
                context.SaveChanges();
            }

            var fakeRepo = new FixedMapIdMyHordesApiRepository(newTownId, userId, "test-user-" + suffix);
            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => fakeRepo);
                });
            });

            var scope2 = factory.Services.CreateScope();
            var service = scope2.ServiceProvider.GetRequiredService<IExternalToolsService>();
            var userInfoProvider = scope2.ServiceProvider.GetRequiredService<IUserInfoProvider>();
            // Simule un claim JWT pointant vers l'ANCIENNE ville (dérive à corriger).
            userInfoProvider.UserId = userId;
            userInfoProvider.UserKey = "test-user-key-" + suffix;
            userInfoProvider.TownDetail = new SimpleMeTownDetailDto { TownId = oldTownId };

            var request = new UpdateRequestDto
            {
                Map = new UpdateRequestMapDto
                {
                    ToolsToUpdate = new UpdateRequestMapToolsToUpdateDetailsDto
                    {
                        IsMyHordesOptimizer = "api", IsGestHordes = "none", IsFataMorgana = "none", IsBigBrothHordes = "none"
                    }
                },
                TownDetails = new UpdateTownDetailsDto { TownId = oldTownId, TownX = 0, TownY = 0, IsChaos = false }
            };

            var sink = new ExternalToolsUpdateProgress(userId, DateTime.UtcNow);
            await service.UpdateExternalsTools(request, sink);

            var state = sink.Snapshot();
            state.RenewedToken.Should().NotBeNull();
            state.RenewedToken.SimpleMe.TownDetails.TownId.Should().Be(newTownId);
            // I1 (revue finale) : un token réémis doit porter jobDetails/avatar, pas seulement la
            // ville — sinon radar fouineur/éclaireur, tooltip technicien et camping-predict s'éteignent
            // silencieusement côté addon jusqu'au prochain shouldRefreshMe().
            state.RenewedToken.SimpleMe.JobDetails.Uid.Should().Be("dig");
            state.RenewedToken.SimpleMe.Avatar.Should().Be("https://example.com/avatar.png");
        }

        /// <summary>
        /// Contre-épreuve du test ci-dessus : sans elle, retirer la condition de dérive (renouveler
        /// systématiquement) ferait quand même passer le premier test.
        /// </summary>
        [Fact]
        public async Task UpdateExternalsTools_TownIdFraisIdentiqueAuClaim_NeRenvoieAucunTokenRenouvele()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var townId = random.Next(1, int.MaxValue);
            var userId = random.Next(1, int.MaxValue);

            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Towns.Add(new Town { IdTown = townId, MapId = townId, Name = "test-town-" + suffix, IsFinished = false });
                context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
                context.SaveChanges();
            }

            var fakeRepo = new FixedMapIdMyHordesApiRepository(townId, userId, "test-user-" + suffix);
            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => fakeRepo);
                });
            });

            var scope2 = factory.Services.CreateScope();
            var service = scope2.ServiceProvider.GetRequiredService<IExternalToolsService>();
            var userInfoProvider = scope2.ServiceProvider.GetRequiredService<IUserInfoProvider>();
            // Claim JWT déjà aligné sur le TownId frais : pas de dérive, pas de renouvellement attendu.
            userInfoProvider.UserId = userId;
            userInfoProvider.UserKey = "test-user-key-" + suffix;
            userInfoProvider.TownDetail = new SimpleMeTownDetailDto { TownId = townId };

            var request = new UpdateRequestDto
            {
                Map = new UpdateRequestMapDto
                {
                    ToolsToUpdate = new UpdateRequestMapToolsToUpdateDetailsDto
                    {
                        IsMyHordesOptimizer = "api", IsGestHordes = "none", IsFataMorgana = "none", IsBigBrothHordes = "none"
                    }
                },
                TownDetails = new UpdateTownDetailsDto { TownId = townId, TownX = 0, TownY = 0, IsChaos = false }
            };

            var sink = new ExternalToolsUpdateProgress(userId, DateTime.UtcNow);
            await service.UpdateExternalsTools(request, sink);

            var state = sink.Snapshot();
            state.RenewedToken.Should().BeNull();
        }
    }
}
