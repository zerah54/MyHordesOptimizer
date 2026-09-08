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
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// ImportUserPictosAsync verrouillait TOUTES les villes du serveur (AcquireAllTownsAsync) le
    /// temps de l'import, même pour un historique d'une seule ville. Il ne verrouille plus que les
    /// villes réellement touchées (AcquireTownsAsync) : une synchro sur une ville sans rapport ne
    /// doit plus attendre.
    /// </summary>
    public class ImportUserPictosLockingTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ImportUserPictosLockingTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task ImportUserPictosAsync_PendantLimport_NeBloquePasUneVilleSansRapport()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var userId = random.Next(1, int.MaxValue);
            var playedMapId = random.Next(1, int.MaxValue);
            var unrelatedMapId = random.Next(1, int.MaxValue);

            var fakeRepo = new SingleUserPictosRepository(new MyHordesUserDetailsDto
            {
                PlayedMaps = new List<MyHordesCitizenRankingDto>
                {
                    new()
                    {
                        MapId = playedMapId,
                        MapName = "test-town-" + suffix,
                        Season = 1,
                        Type = "remote",
                        Phase = "native",
                        Day = 10
                    }
                }
            });

            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(_ => fakeRepo);
                });
            });

            var scope = factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var fetcherService = scope.ServiceProvider.GetRequiredService<IMyHordesFetcherService>();
            var townSyncLock = scope.ServiceProvider.GetRequiredService<TownSyncLock>();

            context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
            context.SaveChanges();

            var externalLock = await townSyncLock.AcquireTownAsync(-unrelatedMapId);

            var importTask = fetcherService.ImportUserPictosAsync(userId);
            var completed = await Task.WhenAny(importTask, Task.Delay(TimeSpan.FromSeconds(5)));

            completed.Should().BeSameAs(importTask, "l'import ne touche pas -unrelatedMapId, il ne doit pas en attendre le verrou");
            (await importTask).Should().BeTrue();

            await externalLock.DisposeAsync();

            context.Towns.AsNoTracking().Any(t => t.MapId == playedMapId).Should().BeTrue();
        }

        private sealed class SingleUserPictosRepository : IMyHordesApiRepository
        {
            private readonly MyHordesUserDetailsDto _response;
            public SingleUserPictosRepository(MyHordesUserDetailsDto response) => _response = response;

            public MyHordesUserDetailsDto GetUserPictos(int userId) => _response;

            public Dictionary<string, MyHordesItem> GetItems() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMe() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMeIdentity() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotImplementedException();
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
