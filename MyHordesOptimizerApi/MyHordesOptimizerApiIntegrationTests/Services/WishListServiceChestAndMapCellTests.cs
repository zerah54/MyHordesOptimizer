using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// GetWishList doit agréger le coffre (tous les citoyens vivants) et les objets posés sur les
    /// cases de la carte, en plus de la banque et des sacs déjà couverts. Preuve que les Include EF
    /// ajoutés à WishListService chargent réellement ces navigations (le mapping AutoMapper seul,
    /// testé en unitaire, suppose déjà les collections chargées).
    /// </summary>
    public class WishListServiceChestAndMapCellTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public WishListServiceChestAndMapCellTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        // MapId == IdTown délibérément (comme ExternalToolsServiceChestTests) : ce test porte sur
        // l'agrégation Chest/MapCellItem de WishListService, pas sur la résolution townId/mapId.
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
        public void GetWishList_ObjetEnCoffreEtSurCase_RemonteChestCountEtMapCellItemCount()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var mapId = townId;
            var item = context.Items.First();

            var externalToolsService = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();
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

            var wishListService = scope.ServiceProvider.GetRequiredService<IWishListService>();
            wishListService.PutWishList(mapId, userId, new List<WishListPutResquestDto>
            {
                new WishListPutResquestDto { Id = item.IdItem, Count = 5 }
            });

            var dto = wishListService.GetWishList(mapId);

            var wishListEntry = dto.WishList.Should().ContainSingle(w => w.Item.Id == item.IdItem).Subject;
            wishListEntry.ChestCount.Should().Be(2);
            wishListEntry.ChestCitizens.Should().ContainSingle().Which.Should().Contain("test-user-");
            wishListEntry.MapCellItemCount.Should().Be(4);
        }
    }
}
