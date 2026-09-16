using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// Le catalogue complet (GetItems) doit exposer BagCount/ChestCount/MapCellItemCount pour
    /// n'importe quel objet de la ville, pas seulement ceux de la wishlist — comme BankCount
    /// aujourd'hui. Preuve que PopulateBagChestMapCellCounts calcule juste sans Include dédié.
    /// </summary>
    public class MyHordesFetcherServiceItemStockTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public MyHordesFetcherServiceItemStockTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        // MapId == IdTown délibérément : ce test porte sur l'agrégation de stock, pas sur la
        // résolution townId/mapId (déjà couverte ailleurs).
        private static (int townId, int userId) SeedTownAndCitizen(MhoContext context)
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var townId = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = townId, Name = "test-town-" + suffix, MapId = townId });
            var userId = random.Next(1, int.MaxValue);
            context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
            context.SaveChanges();

            var lastUpdateInfo = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdateInfo);
            context.SaveChanges();
            context.TownCitizens.Add(new TownCitizen { IdTown = townId, IdUser = userId, IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo });
            context.SaveChanges();

            return (townId, userId);
        }

        [Fact]
        public void GetItems_ObjetEnSacEnCoffreEtSurCase_RemonteLesTroisCompteurs()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First(i => i.IsObsolete != true);

            var externalToolsService = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();
            externalToolsService.UpdateCitizenBag(townId, userId, new List<UpdateObjectDto>
            {
                new UpdateObjectDto { Id = item.IdItem, Count = 3, IsBroken = false }
            });
            externalToolsService.UpdateCitizenChest(townId, userId, new List<UpdateObjectDto>
            {
                new UpdateObjectDto { Id = item.IdItem, Count = 2, IsBroken = false }
            });
            context.MapCells.Add(new MapCell
            {
                IdTown = townId,
                X = 0,
                Y = 0,
                MapCellItems = new List<MapCellItem>
                {
                    new MapCellItem { IdItem = item.IdItem, Count = 4, IsBroken = false }
                }
            });
            context.SaveChanges();

            var fetcherService = scope.ServiceProvider.GetRequiredService<IMyHordesFetcherService>();
            var itemsDto = fetcherService.GetItems(townId).ToList();

            var dto = itemsDto.Should().ContainSingle(i => i.Id == item.IdItem).Subject;
            dto.BagCount.Should().Be(3);
            dto.ChestCount.Should().Be(2);
            dto.MapCellItemCount.Should().Be(4);
        }
    }
}
