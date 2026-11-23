using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.ExternalTools;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Bank;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Fakes;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExternalToolsServiceTownCreationTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Season = 50;
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsServiceTownCreationTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task UpdateExternalsTools_VilleInconnue_CreeVilleCitoyensCadavresBanqueEtCases()
        {
            var (mapId, userId, cadaverId, suffix) = FreeIds();
            SeedUser(userId, suffix);
            var (factory, bankItemId) = FactoryWithNewTown(mapId, userId, cadaverId, suffix, Season);
            using var _ = factory;

            var sink = await RunUpdateAsync(factory, mapId, userId, suffix);

            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var town = context.Towns.SingleOrDefault(t => t.IdTown == -mapId);
            town.Should().NotBeNull(Errors(sink));
            town!.MapId.Should().Be(mapId);
            town.IsFinished.Should().BeFalse();
            context.TownCitizens.Any(c => c.IdTown == -mapId && c.IdUser == userId).Should().BeTrue();
            context.TownCadavers.Any(c => c.IdTown == -mapId && c.IdUser == cadaverId).Should().BeTrue();
            var snapshotId = TownBankHistory.LatestSnapshotId(context, -mapId);
            context.TownBankItems.Single(i => i.IdTown == -mapId && i.IdLastUpdateInfo == snapshotId && i.IdItem == bankItemId)
                .Count.Should().Be(3);
            context.MapCells.Count(cell => cell.IdTown == -mapId).Should().Be(25);
            context.MapCells.Single(cell => cell.IdTown == -mapId && cell.X == 3 && cell.Y == 2).DangerLevel.Should().Be(2);
            // Écrite par la suite de la MAJ sur la ville rechargée après sa création, pas par TownCreation.
            context.TownDefenses.Single(defense => defense.IdTown == -mapId).Total.Should().Be(42);
        }

        [Fact]
        public async Task UpdateExternalsTools_VilleExistante_NeLaRecreePas()
        {
            var (mapId, userId, cadaverId, suffix) = FreeIds();
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Towns.Add(new Town { IdTown = mapId, MapId = mapId, Name = "test-town-" + suffix, IsFinished = false });
                context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
                context.SaveChanges();
            }
            var (factory, _) = FactoryWithNewTown(mapId, userId, cadaverId, suffix, Season);
            using var disposable = factory;

            var sink = await RunUpdateAsync(factory, mapId, userId, suffix);

            MhoState(sink).Status.Should().Be("success", Errors(sink));
            using var verifyScope = _factory.Services.CreateScope();
            var verify = verifyScope.ServiceProvider.GetRequiredService<MhoContext>();
            verify.Towns.Any(t => t.IdTown == -mapId).Should().BeFalse();
            verify.Towns.Count(t => t.MapId == mapId).Should().Be(1);
        }

        [Fact]
        public async Task UpdateExternalsTools_DeuxCitoyensEnMemeTemps_UneSeuleVille()
        {
            var (mapId, userId, cadaverId, suffix) = FreeIds();
            SeedUser(userId, suffix);
            var (factory, _) = FactoryWithNewTown(mapId, userId, cadaverId, suffix, Season);
            using var disposable = factory;

            var sinks = await Task.WhenAll(RunUpdateAsync(factory, mapId, userId, suffix), RunUpdateAsync(factory, mapId, userId, suffix));

            using var verifyScope = _factory.Services.CreateScope();
            var verify = verifyScope.ServiceProvider.GetRequiredService<MhoContext>();
            verify.Towns.Count(t => t.IdTown == -mapId).Should().Be(1, Errors(sinks[0]) + Errors(sinks[1]));
            sinks.Select(sink => MhoState(sink).Status).Should().AllBe("success", Errors(sinks[0]) + Errors(sinks[1]));
        }

        [Fact]
        public async Task UpdateExternalsTools_LigneProvisoireDUneAutreSaison_NeLaModifiePas()
        {
            var (mapId, userId, cadaverId, suffix) = FreeIds();
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Towns.Add(new Town { IdTown = -mapId, MapId = mapId, Season = Season - 1, Name = "ancienne", IsFinished = false });
                context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
                context.SaveChanges();
            }
            var (factory, _) = FactoryWithNewTown(mapId, userId, cadaverId, suffix, Season);
            using var disposable = factory;

            var sink = await RunUpdateAsync(factory, mapId, userId, suffix);

            var mho = MhoState(sink);
            mho.Status.Should().Be("error");
            mho.Errors.Should().ContainSingle(error => error.Unit == ExternalToolUpdateUnits.Map && error.Message.Contains("autre saison"), Errors(sink));
            using var verifyScope = _factory.Services.CreateScope();
            var verify = verifyScope.ServiceProvider.GetRequiredService<MhoContext>();
            var town = verify.Towns.Single(t => t.IdTown == -mapId);
            town.Name.Should().Be("ancienne");
            town.Season.Should().Be(Season - 1);
        }

        [Fact]
        public async Task UpdateExternalsTools_VilleStableEtLigneProvisoireDUneAutreSaison_MetAJourLaVilleStable()
        {
            var (mapId, userId, cadaverId, suffix) = FreeIds();
            var stableTownId = FreeTownKey();
            var otherMapId = FreeTownKey();
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Towns.Add(new Town { IdTown = stableTownId, MapId = mapId, Season = Season, Name = "test-town-" + suffix, IsFinished = false });
                context.Towns.Add(new Town { IdTown = -mapId, MapId = otherMapId, Season = Season - 1, Name = "ancienne", IsFinished = false });
                context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
                context.SaveChanges();
            }
            var (factory, _) = FactoryWithNewTown(mapId, userId, cadaverId, suffix, Season);
            using var disposable = factory;

            var sink = await RunUpdateAsync(factory, mapId, userId, suffix);

            MhoState(sink).Status.Should().Be("success", Errors(sink));
            using var verifyScope = _factory.Services.CreateScope();
            var verify = verifyScope.ServiceProvider.GetRequiredService<MhoContext>();
            verify.Towns.Single(t => t.IdTown == stableTownId).Name.Should().Be("test-town-" + mapId);
            var provisional = verify.Towns.Single(t => t.IdTown == -mapId);
            provisional.Name.Should().Be("ancienne");
            provisional.Season.Should().Be(Season - 1);
            provisional.MapId.Should().Be(otherMapId);
        }

        /// <summary>Ville et joueurs d'identifiants tirés au hasard et absents de la base partagée.</summary>
        private (int mapId, int userId, int cadaverId, string suffix) FreeIds()
        {
            var random = new Random();
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            while (true)
            {
                var mapId = random.Next(1, PreTownIds.Offset);
                var userId = random.Next(1, int.MaxValue);
                var cadaverId = random.Next(1, int.MaxValue);
                if (userId != cadaverId
                    && !context.Towns.Any(t => t.MapId == mapId || t.IdTown == -mapId || t.IdTown == mapId)
                    && !context.Users.Any(u => u.IdUser == userId || u.IdUser == cadaverId))
                {
                    return (mapId, userId, cadaverId, Guid.NewGuid().ToString("N").Substring(0, 8));
                }
            }
        }

        /// <summary>Entier positif qui n'est ni l'IdTown, ni le MapId, ni l'opposé de l'IdTown d'aucune ville de la base partagée.</summary>
        private int FreeTownKey()
        {
            var random = new Random();
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            while (true)
            {
                var key = random.Next(1, PreTownIds.Offset);
                if (!context.Towns.Any(t => t.IdTown == key || t.MapId == key || t.IdTown == -key))
                {
                    return key;
                }
            }
        }

        private void SeedUser(int userId, string suffix)
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
            context.SaveChanges();
        }

        private (WebApplicationFactory<Program> factory, int bankItemId) FactoryWithNewTown(int mapId, int userId, int cadaverId, string suffix, int season)
        {
            Item item;
            using (var scope = _factory.Services.CreateScope())
            {
                item = scope.ServiceProvider.GetRequiredService<MhoContext>().Items.First(i => i.Uid != null);
            }
            var bankItem = new MyHordesItem { Uuid = item.Uid, Id = item.MhId ?? item.IdItem, Count = 3, Broken = false };
            var fakeRepo = new NewTownMyHordesApiRepository(mapId, userId, "test-user-" + suffix, cadaverId, bankItem, season);
            var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => fakeRepo);
                });
            });
            return (factory, item.IdItem);
        }

        private static async Task<ExternalToolsUpdateProgress> RunUpdateAsync(WebApplicationFactory<Program> factory, int mapId, int userId, string suffix)
        {
            using var scope = factory.Services.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();
            var userInfoProvider = scope.ServiceProvider.GetRequiredService<IUserInfoProvider>();
            userInfoProvider.UserId = userId;
            userInfoProvider.UserKey = "test-user-key-" + suffix;
            userInfoProvider.TownDetail = new SimpleMeTownDetailDto { TownId = mapId };

            var request = new UpdateRequestDto
            {
                Map = new UpdateRequestMapDto
                {
                    ToolsToUpdate = new UpdateRequestMapToolsToUpdateDetailsDto
                    {
                        IsMyHordesOptimizer = "api", IsGestHordes = "none", IsFataMorgana = "none", IsBigBrothHordes = "none"
                    }
                },
                TownDetails = new UpdateTownDetailsDto { TownId = mapId, TownX = 0, TownY = 0, IsChaos = false }
            };

            var sink = new ExternalToolsUpdateProgress(userId, DateTime.UtcNow);
            ExternalToolsUpdatePlan.Declare(request, sink);
            await service.UpdateExternalsTools(request, sink);
            return sink;
        }

        private static ExternalToolUpdateState MhoState(ExternalToolsUpdateProgress sink) =>
            sink.Snapshot().Tools.Single(tool => tool.Tool == ExternalToolId.MyHordesOptimizer.ToContractId());

        private static string Errors(ExternalToolsUpdateProgress sink) =>
            string.Join(" | ", sink.Snapshot().Tools.SelectMany(tool => tool.Errors.Select(error => $"{tool.Tool}/{error.Unit}: {error.Message}")));
    }
}
