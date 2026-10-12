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
                // Ville du joueur selon MyHordes : doit être celle de la requête, sinon la carte est refusée.
                MapId = townId,
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

        /// <summary>Itinéraires créés dans MyHordes : remplacés en bloc par ceux du jour, auteurs connus de MHO gardés.</summary>
        [Fact]
        public async Task UpdateExternalsTools_ItinerairesDuJeu_RemplacesParCeuxDuJour()
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
            context.MapRouteGames.Add(new MapRouteGame { IdTown = townId, Day = 2, Label = "hier", Length = 1, Stops = "[[100,100],[100,99]]" });
            context.SaveChanges();

            fakeRepo.Response = new MyHordesUserDetailsDto
            {
                MapId = townId,
                Map = new MyHordesMap
                {
                    Wid = 201,
                    Hei = 201,
                    Days = 3,
                    City = new MyHordesCity { X = TownX, Y = TownY },
                    Zones = new List<MyHordesZone>(),
                    Expeditions = new List<MyHordesExpeditionDto>
                    {
                        new()
                        {
                            Name = "Nord",
                            Length = 4,
                            Author = new MyHordesExpeditionAuthorDto { Id = int.MaxValue },
                            Points = new MyHordesExpeditionPointsDto { X = new List<int> { TownX, TownX, TownX + 2 }, Y = new List<int> { TownY, TownY - 2, TownY - 2 } }
                        }
                    }
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
            var gameRoutes = context.MapRouteGames.AsNoTracking().Where(gameRoute => gameRoute.IdTown == townId).ToList();
            gameRoutes.Should().ContainSingle();
            gameRoutes[0].Label.Should().Be("Nord");
            gameRoutes[0].Day.Should().Be(3);
            gameRoutes[0].Length.Should().Be(4);
            gameRoutes[0].IdAuthor.Should().BeNull();
            gameRoutes[0].Stops.Should().Be("[[100,100],[100,98],[102,98]]");
        }

        private sealed class SingleResponseMyHordesApiRepository : IMyHordesApiRepository
        {
            public MyHordesUserDetailsDto Response { get; set; }

            public MyHordesUserDetailsDto GetMapForToolsUpdate() => Response;

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
