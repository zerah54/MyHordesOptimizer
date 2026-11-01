using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
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
    /// <summary>
    /// Branchement de TownBuildingSync dans la mise à jour des outils, par le vrai chemin
    /// <c>UpdateExternalsTools</c>. Requiert 2026_10_13_town_building.sql sur la base de test.
    /// </summary>
    public class ExternalToolsServiceBuildingSyncTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsServiceBuildingSyncTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        /// <summary>Même réponse que <see cref="FixedMapIdMyHordesApiRepository"/>, avec la ville fournie.</summary>
        private sealed class CityMyHordesApiRepository : IMyHordesApiRepository
        {
            private readonly FixedMapIdMyHordesApiRepository _inner;
            private readonly MyHordesCity _city;

            public CityMyHordesApiRepository(FixedMapIdMyHordesApiRepository inner, MyHordesCity city)
            {
                _inner = inner;
                _city = city;
            }

            public Dictionary<string, MyHordesItem> GetItems() => _inner.GetItems();
            public MyHordesUserDetailsDto GetMe() => WithCity(_inner.GetMe());
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => WithCity(_inner.GetMapForToolsUpdate());
            public MyHordesUserDetailsDto GetMeIdentity() => _inner.GetMeIdentity();
            public MyHordesUserDetailsDto GetUserPictos(int userId) => _inner.GetUserPictos(userId);
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => _inner.GetUsersIdentity(ids);
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => _inner.GetPictos();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => _inner.GetRuins();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => _inner.GetBuildingAsync();
            public List<int> GetTownList(int? season = null) => _inner.GetTownList(season);
            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => _inner.GetTownDetails(ids);
            public MyHordesMap GetMapDetails(int mapId) => _inner.GetMapDetails(mapId);

            private MyHordesUserDetailsDto WithCity(MyHordesUserDetailsDto me)
            {
                me.Map!.City = _city;
                return me;
            }
        }

        [Fact]
        public async Task UpdateExternalsTools_PersistsTheCityBuildingsAndDefense()
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var townId = random.Next(1, int.MaxValue);
            var userId = random.Next(1, int.MaxValue);
            int idBuilding;
            int mhId;
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                context.Towns.Add(new Town { IdTown = townId, MapId = townId, Name = "test-town-" + suffix, IsFinished = false });
                context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
                context.SaveChanges();
                var building = context.Buildings.First(b => b.MhId != null);
                idBuilding = building.IdBuilding;
                mhId = building.MhId!.Value;
            }

            var city = new MyHordesCity
            {
                Chantiers = new() { new MyHordesBuildingDto { Id = mhId, PaCurrent = 40, Actions = 12 } },
                Buildings = new(),
                Defense = new MyHordesDefense { Total = 1352 }
            };
            var repository = new CityMyHordesApiRepository(new FixedMapIdMyHordesApiRepository(townId, userId, "test-user-" + suffix), city);
            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services => services.AddScoped<IMyHordesApiRepository>(_ => repository));
            });

            var scope2 = factory.Services.CreateScope();
            var service = scope2.ServiceProvider.GetRequiredService<IExternalToolsService>();
            var userInfoProvider = scope2.ServiceProvider.GetRequiredService<IUserInfoProvider>();
            // Claim JWT déjà aligné sur la ville : pas de renouvellement de jeton, donc pas de CreateToken.
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

            await service.UpdateExternalsTools(request, new ExternalToolsUpdateProgress(userId, DateTime.UtcNow));

            using var verify = _factory.Services.CreateScope();
            var db = verify.ServiceProvider.GetRequiredService<MhoContext>();
            var row = db.TownBuildings.Single(b => b.IdTown == townId && b.IdBuilding == idBuilding);
            row.IsBuilt.Should().BeFalse();
            row.PaCurrent.Should().Be(40);
            row.ApRemaining.Should().Be(12);
            db.TownDefenses.Single(d => d.IdTown == townId).Total.Should().Be(1352);
        }
    }
}
