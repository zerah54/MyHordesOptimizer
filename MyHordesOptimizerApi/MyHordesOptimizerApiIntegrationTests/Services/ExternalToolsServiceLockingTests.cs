using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Digs;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExternalToolsServiceLockingTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsServiceLockingTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private const int TownX = 100;
        private const int TownY = 100;

        /// <summary>Ville, joueur et case de fouille : realX = TownX + Cell.X, realY = TownY - Cell.Y, donc Cell.X = Cell.Y = 0 fait coincider la case avec TownX/TownY.</summary>
        private static (int townId, int userId) SeedTownUserAndCell(MhoContext context)
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();

            // MapId = IdTown, comme dans les autres fixtures de test : ResolveTownId résout par MapId.
            var townId = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = townId, Name = "test-town-" + suffix, MapId = townId });
            context.SaveChanges();

            var userId = random.Next(1, int.MaxValue);
            context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
            context.SaveChanges();

            context.MapCells.Add(new MapCell { IdTown = townId, X = TownX, Y = TownY });
            context.SaveChanges();

            return (townId, userId);
        }

        private static UpdateRequestDto BuildDigsRequest(int townId, int userId, bool mhoMapEnabled)
        {
            return new UpdateRequestDto
            {
                Map = new UpdateRequestMapDto
                {
                    ToolsToUpdate = new UpdateRequestMapToolsToUpdateDetailsDto
                    {
                        IsMyHordesOptimizer = mhoMapEnabled ? "api" : "none",
                        IsGestHordes = "none",
                        IsFataMorgana = "none",
                        IsBigBrothHordes = "none"
                    }
                },
                TownDetails = new UpdateTownDetailsDto { TownId = townId, TownX = TownX, TownY = TownY, IsChaos = false },
                SuccessedDig = new UpdateSuccesDigDto
                {
                    Cell = new UpdateSuccesDigCellDto { Day = 5, X = 0, Y = 0 },
                    Values = new List<UpdateSuccesDigValueDto>
                    {
                        new() { CitizenId = userId, SuccessDigs = 1, TotalDigs = 2 }
                    }
                }
            };
        }

        [Fact]
        public async Task UpdateExternalsTools_DigsPendantVerrouVilleTenuParUnAutreJoueur_AttendLaLiberation()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();

            var (townId, userId) = SeedTownUserAndCell(context);
            var request = BuildDigsRequest(townId, userId, mhoMapEnabled: false);

            var externalLock = await townSyncLock.AcquireTownAsync(-townId);
            var updateTask = service.UpdateExternalsTools(request);

            await Task.Delay(300);
            context.MapCellDigs.AsNoTracking().Any(dig => dig.IdUser == userId).Should().BeFalse();

            await externalLock.DisposeAsync();
            await updateTask;

            context.MapCellDigs.AsNoTracking().Any(dig => dig.IdUser == userId).Should().BeTrue();
        }

        [Fact]
        public async Task UpdateExternalsTools_DigsPendantQueMhoTaskAttendLaCarte_NeSEcritQuApresSaFin()
        {
            var fakeRepo = new BlockingThenThrowingMyHordesApiRepository();
            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => fakeRepo);
                });
            });

            var scope = factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();

            var (townId, userId) = SeedTownUserAndCell(context);
            var request = BuildDigsRequest(townId, userId, mhoMapEnabled: true);

            var updateTask = service.UpdateExternalsTools(request);

            // mhoTask est bloqué dans GetMapForToolsUpdate tant que fakeRepo.Release() n'a pas été appelé.
            await Task.Delay(300);
            context.MapCellDigs.AsNoTracking().Any(dig => dig.IdUser == userId).Should().BeFalse();

            fakeRepo.Release();
            await updateTask;

            context.MapCellDigs.AsNoTracking().Any(dig => dig.IdUser == userId).Should().BeTrue();
        }

        /// <summary>
        /// Régression : mhoTask videait TOUS les MapCellDig des cases reçues avant que digsTask
        /// n'y réinsère uniquement l'entrée du citoyen courant — la fouille d'un autre citoyen sur
        /// la même case/jour disparaissait à chaque MAJ (perte silencieuse, aucune exception).
        /// </summary>
        [Fact]
        public async Task UpdateExternalsTools_MapEtDigsEnsemble_ConserveLaFouilleDunAutreCitoyen()
        {
            var fakeRepo = new ValidMapResponseMyHordesApiRepository();
            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => fakeRepo);
                });
            });

            var scope = factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();

            var (townId, userId) = SeedTownUserAndCell(context);
            var cell = context.MapCells.Single(c => c.IdTown == townId && c.X == TownX && c.Y == TownY);

            var otherUserId = new Random().Next(1, int.MaxValue);
            context.Users.Add(new User { IdUser = otherUserId, Name = "test-user-other-" + Guid.NewGuid().ToString("N").Substring(0, 8) });
            context.MapCellDigs.Add(new MapCellDig { IdCell = cell.IdCell, IdUser = otherUserId, Day = 5, NbSucces = 2, NbTotalDig = 3 });
            context.SaveChanges();

            var request = BuildDigsRequest(townId, userId, mhoMapEnabled: true);

            await service.UpdateExternalsTools(request);

            context.MapCellDigs.AsNoTracking().Any(dig => dig.IdCell == cell.IdCell && dig.IdUser == otherUserId)
                .Should().BeTrue("la fouille d'un autre citoyen sur la même case/jour ne doit pas être effacée par la MAJ carte");
            context.MapCellDigs.AsNoTracking().Any(dig => dig.IdCell == cell.IdCell && dig.IdUser == userId)
                .Should().BeTrue("la fouille du citoyen courant doit toujours être écrite");
        }

        private sealed class ValidMapResponseMyHordesApiRepository : IMyHordesApiRepository
        {
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => new()
            {
                Map = new MyHordesMap
                {
                    City = new MyHordesCity { X = TownX, Y = TownY },
                    Zones = new List<MyHordesZone> { new() { X = TownX, Y = TownY } }
                }
            };

            public Dictionary<string, MyHordesItem> GetItems() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMe() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMeIdentity() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetUserPictos(int userId) => throw new NotImplementedException();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => throw new NotImplementedException();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => throw new NotImplementedException();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => throw new NotImplementedException();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => throw new NotImplementedException();
            public List<int> GetTownList(int? season = null) => throw new NotImplementedException();
            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => throw new NotImplementedException();
            public MyHordesMap GetMapDetails(int mapId) => throw new NotImplementedException();
        }

        /// <summary>
        /// UpdateCitizenBag (méthode standalone) n'acquérait aucun TownSyncLock. IdTown != MapId
        /// délibérément : le verrou doit porter sur le mapId brut, jamais sur le townId résolu (même
        /// convention que le flux combiné ci-dessus, qui verrouille -townDetails.TownId) — un verrou
        /// pris sur la mauvaise clé laisserait ce test passer sans jamais bloquer.
        /// </summary>
        [Fact]
        public async Task UpdateCitizenBag_MemeVilleIdTownDifferentDuMapId_AttendLaLiberationDuVerrouSurMapId()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();

            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var internalTownId = random.Next(1, int.MaxValue);
            var mapId = random.Next(1, int.MaxValue);
            var userId = random.Next(1, int.MaxValue);

            context.Towns.Add(new Town { IdTown = internalTownId, Name = "test-town-" + suffix, MapId = mapId });
            context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
            context.SaveChanges();
            var lastUpdateInfo = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdateInfo);
            context.SaveChanges();
            context.TownCitizens.Add(new TownCitizen { IdTown = internalTownId, IdUser = userId, IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo });
            context.SaveChanges();

            var externalLock = await townSyncLock.AcquireTownAsync(-mapId);
            var bagTask = Task.Run(() => service.UpdateCitizenBag(mapId, userId, new List<UpdateObjectDto>()));

            // Course contre un délai généreux plutôt que "délai fixe court puis assertion instantanée" :
            // un process froid (première requête MySQL contre le serveur distant partagé) peut dépasser
            // largement 300 ms sans aucun bug de verrou, ce qui rendrait ce test vert à tort.
            var winner = await Task.WhenAny(bagTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(bagTask, "l'écriture du sac ne doit pas se terminer tant que le verrou externe sur -mapId est tenu");
            context.TownCitizens.AsNoTracking().Single(c => c.IdTown == internalTownId && c.IdUser == userId).IdBag.Should().BeNull();

            await externalLock.DisposeAsync();
            await bagTask;

            context.TownCitizens.AsNoTracking().Single(c => c.IdTown == internalTownId && c.IdUser == userId).IdBag.Should().NotBeNull();
        }

        /// <summary>
        /// GetMapForToolsUpdate bloque jusqu'à Release() puis lève : le try/catch de mhoTask absorbe
        /// l'exception, sa Task se termine donc normalement sans qu'aucune donnée de carte valide ne
        /// soit nécessaire — seul l'ordre d'exécution vis-à-vis de digsTask est sous test ici.
        /// </summary>
        private sealed class BlockingThenThrowingMyHordesApiRepository : IMyHordesApiRepository
        {
            private readonly TaskCompletionSource _gate = new(TaskCreationOptions.RunContinuationsAsynchronously);

            public void Release() => _gate.TrySetResult();

            public MyHordesUserDetailsDto GetMapForToolsUpdate()
            {
                _gate.Task.GetAwaiter().GetResult();
                throw new InvalidOperationException("test : mhoTask doit catcher cette exception et terminer normalement");
            }

            public Dictionary<string, MyHordesItem> GetItems() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMe() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMeIdentity() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetUserPictos(int userId) => throw new NotImplementedException();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => throw new NotImplementedException();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => throw new NotImplementedException();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => throw new NotImplementedException();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => throw new NotImplementedException();
            public List<int> GetTownList(int? season = null) => throw new NotImplementedException();
            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => throw new NotImplementedException();
            public MyHordesMap GetMapDetails(int mapId) => throw new NotImplementedException();
        }
    }
}
