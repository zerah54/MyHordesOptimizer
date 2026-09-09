using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
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
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ImportUserPictosThrottleIsolationTest : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;
        public ImportUserPictosThrottleIsolationTest(MyHordesOptimizerApplicationFactory factory) => _factory = factory;

        private sealed class EmptyPictosRepo : IMyHordesApiRepository
        {
            public int CallCount;
            public MyHordesUserDetailsDto GetUserPictos(int userId)
            {
                CallCount++;
                return new MyHordesUserDetailsDto { PlayedMaps = new List<MyHordesCitizenRankingDto>() };
            }
            public MyHordesUserDetailsDto GetMe() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMeIdentity() => throw new NotImplementedException();
            public Dictionary<string, MyHordesItem> GetItems() => new();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => new();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => new();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => new();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => Task.FromResult(new Dictionary<string, MyHordesApiBuildingDto>());
            public List<int> GetTownList(int? season = null) => new();
            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new();
            public MyHordesMap GetMapDetails(int mapId) => null;
        }

        [Fact]
        public async Task ImportUserPictosAsync_AppeleDeuxFoisDeSuite_DeuxScopesDistincts_LeSecondEstThrottle()
        {
            var repo = new EmptyPictosRepo();
            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => repo);
                });
            });

            var userId = new Random().Next(1, int.MaxValue);
            using (var seedScope = factory.Services.CreateScope())
            {
                var ctx = seedScope.ServiceProvider.GetRequiredService<MhoContext>();
                ctx.Users.Add(new User { IdUser = userId, Name = "test-user-" + Guid.NewGuid().ToString("N")[..8] });
                ctx.SaveChanges();
            }

            using (var scope1 = factory.Services.CreateScope())
            {
                var svc1 = scope1.ServiceProvider.GetRequiredService<IMyHordesFetcherService>();
                var result1 = await svc1.ImportUserPictosAsync(userId);
                result1.Should().BeTrue("premier import, jamais fait avant");
            }

            repo.CallCount.Should().Be(1);

            using (var checkScope = factory.Services.CreateScope())
            {
                var ctx = checkScope.ServiceProvider.GetRequiredService<MhoContext>();
                ctx.Users.AsNoTracking().Single(u => u.IdUser == userId).PictosHistoryImportedAt.HasValue.Should().BeTrue();
            }

            using (var scope2 = factory.Services.CreateScope())
            {
                var svc2 = scope2.ServiceProvider.GetRequiredService<IMyHordesFetcherService>();
                var result2 = await svc2.ImportUserPictosAsync(userId);
                result2.Should().BeFalse("moins de 24h depuis le premier import, throttle attendu");
            }

            repo.CallCount.Should().Be(1, "le second appel doit être throttlé, GetUserPictos ne doit pas être rappelé");
        }

        /// <summary>
        /// Le check-then-act de PictosHistoryImportedAt (lu avant l'appel MyHordes, écrit seulement à
        /// la toute fin) laissait passer un second import démarré pendant que le premier était encore
        /// en vol : les deux appelaient GetUserPictos et traitaient l'historique en double (observé en
        /// prod le 2026-09-09, cf mapId recyclé x2 en quelques secondes pour le même joueur).
        /// </summary>
        [Fact]
        public async Task ImportUserPictosAsync_DeuxAppelsConcurrents_LeSecondEstThrottleMemeSiLePremierNaPasFini()
        {
            var suffix = Guid.NewGuid().ToString("N")[..8];
            var repo = new SlowPictosRepo();

            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => repo);
                });
            });

            var userId = new Random().Next(1, int.MaxValue);
            using (var seedScope = factory.Services.CreateScope())
            {
                var ctx = seedScope.ServiceProvider.GetRequiredService<MhoContext>();
                ctx.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
                ctx.SaveChanges();
            }

            using var scope1 = factory.Services.CreateScope();
            using var scope2 = factory.Services.CreateScope();
            var svc1 = scope1.ServiceProvider.GetRequiredService<IMyHordesFetcherService>();
            var svc2 = scope2.ServiceProvider.GetRequiredService<IMyHordesFetcherService>();

            var taskA = Task.Run(() => svc1.ImportUserPictosAsync(userId));
            repo.WaitEntered(TimeSpan.FromSeconds(5))
                .Should().BeTrue("le premier import doit avoir démarré son appel MyHordes avant qu'on lance le second");

            var taskB = Task.Run(() => svc2.ImportUserPictosAsync(userId));
            // Laisse au second appel une chance d'atteindre GetUserPictos si le throttle n'est pas
            // posé avant l'appel réseau (c'est justement ce que ce test vérifie).
            await Task.Delay(200);
            repo.Release();

            var both = Task.WhenAll(taskA, taskB);
            var completed = await Task.WhenAny(both, Task.Delay(TimeSpan.FromSeconds(5)));
            completed.Should().BeSameAs(both, "les deux imports concurrents doivent se terminer, pas rester bloqués");

            repo.CallCount.Should().Be(1,
                "un second import concurrent doit être throttlé sans rappeler MyHordes, même si le premier n'a pas fini d'écrire PictosHistoryImportedAt");
        }

        private sealed class SlowPictosRepo : IMyHordesApiRepository
        {
            private readonly ManualResetEventSlim _entered = new(false);
            private readonly ManualResetEventSlim _releaseGate = new(false);
            public int CallCount;

            public MyHordesUserDetailsDto GetUserPictos(int userId)
            {
                Interlocked.Increment(ref CallCount);
                _entered.Set();
                _releaseGate.Wait(TimeSpan.FromSeconds(5));
                return new MyHordesUserDetailsDto { PlayedMaps = new List<MyHordesCitizenRankingDto>() };
            }

            public bool WaitEntered(TimeSpan timeout) => _entered.Wait(timeout);
            public void Release() => _releaseGate.Set();

            public MyHordesUserDetailsDto GetMe() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMeIdentity() => throw new NotImplementedException();
            public Dictionary<string, MyHordesItem> GetItems() => new();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => new();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => new();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => new();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => Task.FromResult(new Dictionary<string, MyHordesApiBuildingDto>());
            public List<int> GetTownList(int? season = null) => new();
            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new();
            public MyHordesMap GetMapDetails(int mapId) => null;
        }

        /// <summary>
        /// PictosHistoryImportedAt n'est écrit qu'à la fin d'un import RÉUSSI (PersistUserPictos).
        /// Un joueur hors ville (GetSimpleMeAsync, branche "hors ville") relance donc
        /// ImportUserPictosAsync à CHAQUE connexion tant que MyHordes répond 429 : aucune mémoire de
        /// l'échec, le throttle 24h ne s'active jamais (observé en prod le 2026-09-09, doublant la
        /// consommation du quota MyHordes du joueur à chaque tentative).
        /// </summary>
        [Fact]
        public async Task ImportUserPictosAsync_ApresUnEchecMyHordes_NeRetentePasAvantLeCooldownDechec()
        {
            var repo = new FailingPictosRepo();
            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => repo);
                });
            });

            var userId = new Random().Next(1, int.MaxValue);
            using (var seedScope = factory.Services.CreateScope())
            {
                var ctx = seedScope.ServiceProvider.GetRequiredService<MhoContext>();
                ctx.Users.Add(new User { IdUser = userId, Name = "test-user-" + Guid.NewGuid().ToString("N")[..8] });
                ctx.SaveChanges();
            }

            using (var scope1 = factory.Services.CreateScope())
            {
                var svc1 = scope1.ServiceProvider.GetRequiredService<IMyHordesFetcherService>();
                await Assert.ThrowsAsync<MyHordesApiException>(() => svc1.ImportUserPictosAsync(userId));
            }
            repo.CallCount.Should().Be(1);

            using (var scope2 = factory.Services.CreateScope())
            {
                var svc2 = scope2.ServiceProvider.GetRequiredService<IMyHordesFetcherService>();
                var result2 = await svc2.ImportUserPictosAsync(userId);
                result2.Should().BeFalse("un échec récent (quota MyHordes) doit throttler les tentatives suivantes, pas les relancer aussitôt");
            }

            repo.CallCount.Should().Be(1, "le second appel ne doit pas retaper MyHordes pendant le cooldown d'échec");
        }

        private sealed class FailingPictosRepo : IMyHordesApiRepository
        {
            public int CallCount;

            public MyHordesUserDetailsDto GetUserPictos(int userId)
            {
                Interlocked.Increment(ref CallCount);
                throw new MyHordesApiException("Quota dépassé.", HttpStatusCode.TooManyRequests);
            }

            public MyHordesUserDetailsDto GetMe() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMeIdentity() => throw new NotImplementedException();
            public Dictionary<string, MyHordesItem> GetItems() => new();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => new();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => new();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => new();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => Task.FromResult(new Dictionary<string, MyHordesApiBuildingDto>());
            public List<int> GetTownList(int? season = null) => new();
            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new();
            public MyHordesMap GetMapDetails(int mapId) => null;
        }
    }
}
