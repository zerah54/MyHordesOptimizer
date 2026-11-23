using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.ExternalTools;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Impl.Users;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Fakes;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExternalToolsServiceNewUserTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Season = 50;
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsServiceNewUserTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task UpdateExternalsTools_JoueurAbsent_CreeLeJoueurEtReussit()
        {
            var (mapId, userId, cadaverId, suffix) = FreeIds();
            var userName = "test-user-" + suffix;
            using var factory = FactoryWithNewTown(mapId, userId, userName, cadaverId);

            var sink = await RunUpdateAsync(factory, mapId, userId, userName, suffix);

            MhoState(sink).Status.Should().Be("success", Errors(sink));
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            context.Users.Single(u => u.IdUser == userId).Name.Should().Be(userName);
            context.Towns.Any(t => t.IdTown == -mapId).Should().BeTrue();
        }

        [Fact]
        public async Task UpdateExternalsTools_JoueurAbsent_DeuxMajSimultanees_UneSeuleLigne()
        {
            var (mapId, userId, cadaverId, suffix) = FreeIds();
            var userName = "test-user-" + suffix;
            using var factory = FactoryWithNewTown(mapId, userId, userName, cadaverId);

            var sinks = await Task.WhenAll(
                RunUpdateAsync(factory, mapId, userId, userName, suffix),
                RunUpdateAsync(factory, mapId, userId, userName, suffix));

            sinks.Select(sink => MhoState(sink).Status).Should().AllBe("success", Errors(sinks[0]) + Errors(sinks[1]));
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            context.Users.Count(u => u.IdUser == userId).Should().Be(1);
        }

        [Fact]
        public async Task UpdateExternalsTools_JoueurPresent_NeReecritPasSonPseudo()
        {
            var (mapId, userId, cadaverId, suffix) = FreeIds();
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Users.Add(new User { IdUser = userId, Name = "pseudo-en-base", Avatar = "avatar-en-base" });
                context.SaveChanges();
            }
            // MyHordes renvoie le pseudo en base : seul le jeton porte un autre pseudo.
            using var factory = FactoryWithNewTown(mapId, userId, "pseudo-en-base", cadaverId);

            var sink = await RunUpdateAsync(factory, mapId, userId, "pseudo-du-jeton-" + suffix, suffix);

            MhoState(sink).Status.Should().Be("success", Errors(sink));
            using var verifyScope = _factory.Services.CreateScope();
            var user = verifyScope.ServiceProvider.GetRequiredService<MhoContext>().Users.Single(u => u.IdUser == userId);
            user.Name.Should().Be("pseudo-en-base");
            user.Avatar.Should().Be("avatar-en-base");
        }

        [Fact]
        public async Task UpdateExternalsTools_JoueurAbsent_SacsSeuls_CreeLeJoueurEtReussit()
        {
            var (mapId, userId, citizenId, suffix) = FreeIds();
            SeedTownWithCitizen(mapId, citizenId, suffix);
            var userName = "test-user-" + suffix;
            using var factory = FactoryWithNewTown(mapId, userId, userName, citizenId);
            var request = MapRequest(mapId, "none");
            request.Bags = new UpdateBagsRequestDto
            {
                Contents = new List<UpdateBagsContentsDto> { new() { UserId = citizenId, Objects = new List<UpdateObjectDto>() } },
                ToolsToUpdate = new UpdateRequestToolsToUpdateDetailsDto { IsMyHordesOptimizer = true }
            };

            var sink = await RunUpdateAsync(factory, mapId, userId, userName, suffix, request);

            MhoState(sink).Status.Should().Be("success", Errors(sink));
            using var scope = _factory.Services.CreateScope();
            scope.ServiceProvider.GetRequiredService<MhoContext>().Users.Single(u => u.IdUser == userId).Name.Should().Be(userName);
        }

        [Fact]
        public void UpdateCitizenBag_JoueurAbsent_CreeLeJoueurEtReussit()
        {
            var (mapId, userId, citizenId, suffix) = FreeIds();
            SeedTownWithCitizen(mapId, citizenId, suffix);
            var userName = "test-user-" + suffix;
            using var factory = FactoryWithNewTown(mapId, userId, userName, citizenId);
            using (var scope = factory.Services.CreateScope())
            {
                SetToken(scope.ServiceProvider, mapId, userId, userName, suffix);

                var lastUpdate = scope.ServiceProvider.GetRequiredService<IExternalToolsService>().UpdateCitizenBag(mapId, citizenId, new List<UpdateObjectDto>());

                lastUpdate.UserId.Should().Be(userId);
            }

            using var verifyScope = _factory.Services.CreateScope();
            verifyScope.ServiceProvider.GetRequiredService<MhoContext>().Users.Single(u => u.IdUser == userId).Name.Should().Be(userName);
        }

        [Fact]
        public async Task UserCreation_InsertionConcurrenteNonValidee_AttendPuisNeDoublePas()
        {
            var (_, userId, _, suffix) = FreeIds();
            var userName = "test-user-" + suffix;
            using var scopeA = _factory.Services.CreateScope();
            using var scopeB = _factory.Services.CreateScope();
            using var watchScope = _factory.Services.CreateScope();
            var contextA = scopeA.ServiceProvider.GetRequiredService<MhoContext>();
            var contextB = scopeB.ServiceProvider.GetRequiredService<MhoContext>();
            var watch = watchScope.ServiceProvider.GetRequiredService<MhoContext>();
            contextB.Database.OpenConnection();
            var connectionB = contextB.Database.SqlQueryRaw<long>("SELECT CAST(CONNECTION_ID() AS SIGNED) AS Value").AsEnumerable().Single();

            using (var transactionA = contextA.Database.BeginTransaction())
            {
                UserCreation.EnsureExists(contextA, userId, userName);
                var insertB = Task.Run(() => UserCreation.EnsureExists(contextB, userId, userName));
                // B doit être bloqué sur le verrou de ligne de A avant la validation : sinon il verrait la ligne déjà validée.
                var deadline = DateTime.UtcNow.AddSeconds(15);
                while (watch.Database.SqlQuery<long>($"SELECT COUNT(*) AS Value FROM information_schema.PROCESSLIST WHERE ID = {connectionB} AND INFO LIKE {"%INSERT%Users%"}").AsEnumerable().Single() == 0)
                {
                    insertB.IsCompleted.Should().BeFalse("B ne peut pas finir tant que A n'a pas validé");
                    DateTime.UtcNow.Should().BeBefore(deadline, "B n'a jamais atteint son insertion");
                    await Task.Delay(50);
                }
                transactionA.Commit();

                await insertB;
            }

            using var verifyScope = _factory.Services.CreateScope();
            verifyScope.ServiceProvider.GetRequiredService<MhoContext>().Users.Count(u => u.IdUser == userId).Should().Be(1);
        }

        [Fact]
        public async Task UpdateExternalsTools_JoueurAbsent_CreeLeJoueurSousLeVerrouDeLaVille()
        {
            var (mapId, userId, cadaverId, suffix) = FreeIds();
            var userName = "test-user-" + suffix;
            using var factory = FactoryWithNewTown(mapId, userId, userName, cadaverId);
            Task<ExternalToolsUpdateProgress> update;
            await using (await factory.Services.GetRequiredService<TownSyncLock>().AcquireTownAsync(-mapId))
            {
                update = Task.Run(() => RunUpdateAsync(factory, mapId, userId, userName, suffix));
                await Task.Delay(TimeSpan.FromSeconds(3));
                using var scope = _factory.Services.CreateScope();
                scope.ServiceProvider.GetRequiredService<MhoContext>().Users.Any(u => u.IdUser == userId).Should().BeFalse("le joueur ne se crée que sous le verrou de la ville");
            }

            (await Task.WhenAny(update, Task.Delay(TimeSpan.FromSeconds(60)))).Should().BeSameAs(update);
            var sink = await update;
            MhoState(sink).Status.Should().Be("success", Errors(sink));
            using var verifyScope = _factory.Services.CreateScope();
            verifyScope.ServiceProvider.GetRequiredService<MhoContext>().Users.Single(u => u.IdUser == userId).Name.Should().Be(userName);
        }

        [Fact]
        public void UserCreation_PseudoVide_NInserePasDeLigne()
        {
            var (_, userId, _, _) = FreeIds();
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();

            UserCreation.EnsureExists(context, userId, "");
            UserCreation.EnsureExists(context, userId, null);

            context.Users.Any(u => u.IdUser == userId).Should().BeFalse();
        }

        [Fact]
        public void UserCreation_JoueurExistant_NeModifiePasSonPseudo()
        {
            var (_, userId, _, _) = FreeIds();
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Users.Add(new User { IdUser = userId, Name = "pseudo-en-base" });
                context.SaveChanges();
            }

            using (var scope = _factory.Services.CreateScope())
            {
                UserCreation.EnsureExists(scope.ServiceProvider.GetRequiredService<MhoContext>(), userId, "autre-pseudo");
            }

            using var verifyScope = _factory.Services.CreateScope();
            verifyScope.ServiceProvider.GetRequiredService<MhoContext>().Users.Single(u => u.IdUser == userId).Name.Should().Be("pseudo-en-base");
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

        [Fact]
        public async Task UpdateExternalsTools_VilleQuitteeDepuisLeDernierImport_ImporteLesPictosSansAttendre24h()
        {
            var (mapId, userId, cadaverId, suffix) = FreeIds();
            var userName = "test-user-" + suffix;
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Users.Add(new User
                {
                    IdUser = userId,
                    Name = userName,
                    PictosHistoryImportedAt = DateTime.UtcNow.AddHours(-1),
                    PictosImportMapId = mapId + 1
                });
                context.SaveChanges();
            }
            using var factory = FactoryWithNewTown(mapId, userId, userName, cadaverId, out var fakeRepo);

            var sink = await RunUpdateAsync(factory, mapId, userId, userName, suffix);

            MhoState(sink).Status.Should().Be("success", Errors(sink));
            (await WaitUntil(() => fakeRepo.UserPictosCallCount > 0)).Should().BeTrue("le joueur a changé de ville depuis le dernier import");
            (await WaitUntil(() => ImportMapId(userId) == mapId)).Should().BeTrue();
        }

        private static async Task<bool> WaitUntil(Func<bool> condition)
        {
            var deadline = DateTime.UtcNow + TimeSpan.FromSeconds(5);
            while (DateTime.UtcNow < deadline && !condition())
            {
                await Task.Delay(50);
            }
            return condition();
        }

        /// <summary>Scope frais à chaque lecture : un DbContext réutilisé peut garder un instantané périmé.</summary>
        private int? ImportMapId(int userId)
        {
            using var scope = _factory.Services.CreateScope();
            return scope.ServiceProvider.GetRequiredService<MhoContext>().Users.AsNoTracking()
                .Single(u => u.IdUser == userId).PictosImportMapId;
        }

        /// <summary>Fabrique dont MyHordes renvoie une ville inconnue où <paramref name="myHordesName"/> est citoyen.</summary>
        private WebApplicationFactory<Program> FactoryWithNewTown(int mapId, int userId, string myHordesName, int cadaverId) =>
            FactoryWithNewTown(mapId, userId, myHordesName, cadaverId, out _);

        private WebApplicationFactory<Program> FactoryWithNewTown(int mapId, int userId, string myHordesName, int cadaverId, out NewTownMyHordesApiRepository fakeRepo)
        {
            Item item;
            using (var scope = _factory.Services.CreateScope())
            {
                item = scope.ServiceProvider.GetRequiredService<MhoContext>().Items.First(i => i.Uid != null);
            }
            var bankItem = new MyHordesItem { Uuid = item.Uid, Id = item.MhId ?? item.IdItem, Count = 3, Broken = false };
            var repo = new NewTownMyHordesApiRepository(mapId, userId, myHordesName, cadaverId, bankItem, Season);
            fakeRepo = repo;
            return _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => repo);
                });
            });
        }

        /// <summary>Ville connue (IdTown = MapId = <paramref name="mapId"/>) dont <paramref name="citizenId"/> est citoyen.</summary>
        private void SeedTownWithCitizen(int mapId, int citizenId, string suffix)
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            context.Towns.Add(new Town { IdTown = mapId, MapId = mapId, Name = "test-town-" + suffix, IsFinished = false });
            context.Users.Add(new User { IdUser = citizenId, Name = "test-citizen-" + suffix });
            var lastUpdate = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdate);
            context.SaveChanges();
            context.TownCitizens.Add(new TownCitizen { IdTown = mapId, IdUser = citizenId, JobUid = "job_none", IdLastUpdateInfo = lastUpdate.IdLastUpdateInfo });
            context.SaveChanges();
        }

        private static void SetToken(IServiceProvider services, int mapId, int userId, string tokenUserName, string suffix)
        {
            var userInfoProvider = services.GetRequiredService<IUserInfoProvider>();
            userInfoProvider.UserId = userId;
            userInfoProvider.UserName = tokenUserName;
            userInfoProvider.UserKey = "test-user-key-" + suffix;
            userInfoProvider.TownDetail = new SimpleMeTownDetailDto { TownId = mapId };
        }

        /// <summary>MAJ dont la carte MHO vaut <paramref name="mhoMap"/> (« api » ou « none ») ; les autres outils sont à « none ».</summary>
        private static UpdateRequestDto MapRequest(int mapId, string mhoMap) => new()
        {
            Map = new UpdateRequestMapDto
            {
                ToolsToUpdate = new UpdateRequestMapToolsToUpdateDetailsDto
                {
                    IsMyHordesOptimizer = mhoMap, IsGestHordes = "none", IsFataMorgana = "none", IsBigBrothHordes = "none"
                }
            },
            TownDetails = new UpdateTownDetailsDto { TownId = mapId, TownX = 0, TownY = 0, IsChaos = false }
        };

        private static async Task<ExternalToolsUpdateProgress> RunUpdateAsync(WebApplicationFactory<Program> factory, int mapId, int userId, string tokenUserName, string suffix, UpdateRequestDto? request = null)
        {
            using var scope = factory.Services.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();
            SetToken(scope.ServiceProvider, mapId, userId, tokenUserName, suffix);
            request ??= MapRequest(mapId, "api");

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
