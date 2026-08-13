using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExternalToolsServiceMapUpdateTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsServiceMapUpdateTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private const int TownX = 100;
        private const int TownY = 100;

        private static int SeedTown(MhoContext context)
        {
            var townId = new Random().Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = townId, Name = "test-town-" + Guid.NewGuid().ToString("N")[..8], MapId = townId });
            context.SaveChanges();
            return townId;
        }

        /// <summary>
        /// Régression : une case jamais vue en base (absente de allCell) faisait planter
        /// UpdateAllButKeysProperties avec un TargetException ("Non-static method requires a
        /// target"), car cellModel valait null et l'appel se faisait sans garde.
        /// </summary>
        [Fact]
        public async Task UpdateExternalsTools_ZoneJamaisVueEnBase_CreeLaCaseSansPlanter()
        {
            var fakeRepo = new SingleResponseMyHordesApiRepository();
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

            var townId = SeedTown(context);

            fakeRepo.Response = new MyHordesUserDetailsDto
            {
                Map = new MyHordesMap
                {
                    City = new MyHordesCity { X = TownX, Y = TownY },
                    Zones = new List<MyHordesZone> { new() { X = TownX + 1, Y = TownY } }
                }
            };

            var request = new UpdateRequestDto
            {
                Map = new UpdateRequestMapDto
                {
                    ToolsToUpdate = new UpdateRequestMapToolsToUpdateDetailsDto
                    {
                        IsMyHordesOptimizer = "api",
                        IsGestHordes = "none",
                        IsFataMorgana = "none",
                        IsBigBrothHordes = "none"
                    }
                },
                TownDetails = new UpdateTownDetailsDto { TownId = townId, TownX = TownX, TownY = TownY, IsChaos = false }
            };

            var response = await service.UpdateExternalsTools(request);

            response.MapResponseDto.MhoApiStatus.Should().Be(ExternalToolsUpdateResponseType.Ok.GetDescription());
            context.MapCells.AsNoTracking()
                .Any(cell => cell.IdTown == townId && cell.X == TownX + 1 && cell.Y == TownY)
                .Should().BeTrue();
        }

        private sealed class SingleResponseMyHordesApiRepository : IMyHordesApiRepository
        {
            public MyHordesUserDetailsDto Response { get; set; }

            public MyHordesUserDetailsDto GetMapForToolsUpdate() => Response;

            public Dictionary<string, MyHordesItem> GetItems() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMe() => throw new NotImplementedException();
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
