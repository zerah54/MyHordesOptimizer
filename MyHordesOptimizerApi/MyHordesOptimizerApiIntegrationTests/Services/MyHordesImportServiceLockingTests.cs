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
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// MigrateTownId (privée, appelée par ImportSingleTownAsync/ImportTownsAsync) réécrivait toutes
    /// les tables town-scoped sans aucun TownSyncLock. Cas « double-ville » du chantier : oldIdTown
    /// vaut déjà -mapId (calculé par l'appelant), PAS -oldIdTown qui vaudrait +mapId et n'exclurait
    /// personne — ce test échoue si le mauvais signe est utilisé pour la clé de verrou.
    /// </summary>
    public class MyHordesImportServiceLockingTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public MyHordesImportServiceLockingTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task ImportSingleTownAsync_MigrationPendantVerrouTenuSurOldIdTown_AttendLaLiberation()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var mapId = random.Next(1, int.MaxValue);
            var newIdTown = random.Next(1, int.MaxValue);
            var oldIdTown = -mapId;

            var fakeRepo = new SingleTownMigrationRepository(newIdTown, mapId);
            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => fakeRepo);
                });
            });

            var scope = factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();
            var importService = scope.ServiceProvider.GetRequiredService<IMyHordesImportService>();

            // Ligne provisoire (IdTown = -mapId, pas encore migrée), comme le pose ImportTownsAsync.
            context.Towns.Add(new Town { IdTown = oldIdTown, Name = "test-town-" + suffix });
            context.SaveChanges();

            // oldIdTown EST DÉJÀ -mapId : c'est la clé de verrou attendue, pas -oldIdTown (= +mapId).
            var externalLock = await townSyncLock.AcquireTownAsync(oldIdTown);
            // ImportSingleTownAsync n'est PAS réellement async (aucun await avant MigrateTownId) :
            // l'appeler directement exécuterait la portion synchrone — dont le verrou bloquant de
            // MigrateTownId — sur CE thread, avant même de rendre la main pour libérer externalLock
            // plus bas → auto-interblocage. Task.Run isole ça sur un thread du pool, comme pour les
            // autres méthodes synchrones testées dans ce chantier (WishListServiceLockingTests, etc.).
            var importTask = Task.Run(() => importService.ImportSingleTownAsync(mapId));

            // Course contre un délai généreux plutôt que "délai fixe court puis assertion instantanée" :
            // un process froid (première requête MySQL contre le serveur distant partagé) peut dépasser
            // largement 300 ms sans aucun bug de verrou, ce qui rendrait ce test vert à tort.
            var winner = await Task.WhenAny(importTask, Task.Delay(TimeSpan.FromSeconds(2)));
            winner.Should().NotBeSameAs(importTask, "la migration ne doit pas se terminer tant que le verrou externe sur oldIdTown est tenu");
            context.Towns.AsNoTracking().Any(t => t.IdTown == newIdTown).Should().BeFalse("la migration ne doit pas avoir eu lieu tant que le verrou externe est tenu");
            context.Towns.AsNoTracking().Any(t => t.IdTown == oldIdTown).Should().BeTrue("la ligne provisoire n'a pas encore été migrée");

            await externalLock.DisposeAsync();
            await importTask;

            context.Towns.AsNoTracking().Any(t => t.IdTown == newIdTown).Should().BeTrue("la migration doit s'être terminée une fois le verrou externe libéré");
            context.Towns.AsNoTracking().Any(t => t.IdTown == oldIdTown).Should().BeFalse("la ligne provisoire doit avoir été migrée, pas dupliquée");
        }

        /// <summary>
        /// Preuve de l'absence d'interblocage : sans ordre déterministe, deux migrations concurrentes
        /// qui verrouillent les deux MÊMES clés en rôles inversés (A : oldIdTown=-P→newIdTown=Q, donc
        /// clés {-P,-Q} ; B : oldIdTown=-Q→newIdTown=P, mêmes clés {-Q,-P}) provoqueraient un
        /// interblocage classique (A tient -P et attend -Q pendant que B tient -Q et attend -P).
        /// L'ordre par valeur numérique (Math.Min/Math.Max dans MigrateTownId) élimine ce risque : les
        /// deux migrations tentent de verrouiller la MÊME clé (la plus petite) en premier.
        /// </summary>
        [Fact]
        public async Task ImportSingleTownAsync_DeuxMigrationsConcurrentesAuxClesInversees_SeTerminentSansInterblocage()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var mapIdP = random.Next(1, int.MaxValue / 2);
            var mapIdQ = random.Next(int.MaxValue / 2, int.MaxValue);

            // Migration A : ville de mapId P, migrée vers l'IdTown réel Q.
            // Migration B : ville de mapId Q, migrée vers l'IdTown réel P.
            // -> mêmes deux clés de verrou {-P, -Q}, en rôles inversés entre les deux migrations.
            var fakeRepo = new TwoWayMigrationRepository(new Dictionary<int, MyHordesTownDetailsDto>
            {
                [mapIdP] = new MyHordesTownDetailsDto { Id = mapIdQ, MapId = mapIdP, Season = null, Citizens = null },
                [mapIdQ] = new MyHordesTownDetailsDto { Id = mapIdP, MapId = mapIdQ, Season = null, Citizens = null }
            });
            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => fakeRepo);
                });
            });

            using (var seedScope = factory.Services.CreateScope())
            {
                var seedContext = seedScope.ServiceProvider.GetRequiredService<MhoContext>();
                seedContext.Towns.Add(new Town { IdTown = -mapIdP, Name = "test-town-A-" + suffix });
                seedContext.Towns.Add(new Town { IdTown = -mapIdQ, Name = "test-town-B-" + suffix });
                seedContext.SaveChanges();
            }

            // Scopes/DbContext séparés : EF Core n'est pas thread-safe, chaque migration a besoin du
            // sien. Le TownSyncLock, lui, est un singleton partagé par la factory — c'est lui qui est
            // sous test.
            var scopeA = factory.Services.CreateScope();
            var importServiceA = scopeA.ServiceProvider.GetRequiredService<IMyHordesImportService>();
            var scopeB = factory.Services.CreateScope();
            var importServiceB = scopeB.ServiceProvider.GetRequiredService<IMyHordesImportService>();

            var taskA = Task.Run(() => importServiceA.ImportSingleTownAsync(mapIdP));
            var taskB = Task.Run(() => importServiceB.ImportSingleTownAsync(mapIdQ));

            var both = Task.WhenAll(taskA, taskB);
            var winner = await Task.WhenAny(both, Task.Delay(TimeSpan.FromSeconds(10)));
            winner.Should().BeSameAs(both, "un ordre de verrouillage non déterministe interbloquerait les deux migrations concurrentes (timeout = interblocage détecté)");
            await both;

            using var assertScope = factory.Services.CreateScope();
            var assertContext = assertScope.ServiceProvider.GetRequiredService<MhoContext>();
            assertContext.Towns.AsNoTracking().Any(t => t.IdTown == mapIdQ).Should().BeTrue("migration A (mapId P -> IdTown Q) doit avoir abouti");
            assertContext.Towns.AsNoTracking().Any(t => t.IdTown == mapIdP).Should().BeTrue("migration B (mapId Q -> IdTown P) doit avoir abouti");
            assertContext.Towns.AsNoTracking().Any(t => t.IdTown == -mapIdP).Should().BeFalse("ligne provisoire A migrée, pas dupliquée");
            assertContext.Towns.AsNoTracking().Any(t => t.IdTown == -mapIdQ).Should().BeFalse("ligne provisoire B migrée, pas dupliquée");
        }

        /// <summary>Sert ImportSingleTownAsync(mapId) : /json/towns renvoie une ville dont l'Id diffère du mapId interrogé, déclenchant la migration. /json/map est ensuite appelé (try/catch qui absorbe l'échec) : on lève simplement, sans conséquence sur le test.</summary>
        private sealed class SingleTownMigrationRepository : IMyHordesApiRepository
        {
            private readonly int _newIdTown;
            private readonly int _mapId;

            public SingleTownMigrationRepository(int newIdTown, int mapId)
            {
                _newIdTown = newIdTown;
                _mapId = mapId;
            }

            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new()
            {
                new MyHordesTownDetailsDto { Id = _newIdTown, MapId = _mapId, Season = null, Citizens = null }
            };

            public MyHordesMap GetMapDetails(int mapId) => throw new InvalidOperationException("test : absorbé par le try/catch de ImportSingleTownAsync");

            public Dictionary<string, MyHordesItem> GetItems() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMe() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMeIdentity() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetUserPictos(int userId) => throw new NotSupportedException();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => throw new NotSupportedException();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => throw new NotSupportedException();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => throw new NotSupportedException();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => throw new NotSupportedException();
            public List<int> GetTownList(int? season = null) => throw new NotSupportedException();
        }

        /// <summary>Comme <see cref="SingleTownMigrationRepository"/>, mais renvoie une réponse différente selon le mapId interrogé (ids[0]) — nécessaire pour faire tourner deux migrations distinctes en parallèle sur la même instance factice.</summary>
        private sealed class TwoWayMigrationRepository : IMyHordesApiRepository
        {
            private readonly Dictionary<int, MyHordesTownDetailsDto> _byMapId;

            public TwoWayMigrationRepository(Dictionary<int, MyHordesTownDetailsDto> byMapId)
            {
                _byMapId = byMapId;
            }

            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new() { _byMapId[ids[0]] };

            public MyHordesMap GetMapDetails(int mapId) => throw new InvalidOperationException("test : absorbé par le try/catch de ImportSingleTownAsync");

            public Dictionary<string, MyHordesItem> GetItems() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMe() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetMeIdentity() => throw new NotSupportedException();
            public MyHordesUserDetailsDto GetUserPictos(int userId) => throw new NotSupportedException();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => throw new NotSupportedException();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => throw new NotSupportedException();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => throw new NotSupportedException();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => throw new NotSupportedException();
            public List<int> GetTownList(int? season = null) => throw new NotSupportedException();
        }
    }
}
