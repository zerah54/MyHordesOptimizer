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
    }
}
