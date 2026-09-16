using System.Collections.Generic;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Items;
using MyHordesOptimizerApi.MappingProfiles.Wishlists;
using MyHordesOptimizerApi.Models;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MappingProfiles
{
    public class WishListItemMappingTests
    {
        private static IMapper NewMapper()
        {
            var config = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<WishListMappingProfile>();
                cfg.AddProfile<ItemsMappingProfiles>();
            }, NullLoggerFactory.Instance);
            return config.CreateMapper();
        }

        private static TownWishListItem BuildWishListItem()
        {
            var item = new Item { IdItem = 3 };

            var chest = new Chest
            {
                IdChest = 10,
                ChestItems = new List<ChestItem>
                {
                    new ChestItem { IdChest = 10, IdItem = 3, IsBroken = false, Count = 2 }
                }
            };
            var aliveCitizenWithChest = new TownCitizen
            {
                IdTown = 1,
                IdUser = 5,
                Dead = false,
                IdChestNavigation = chest,
                IdUserNavigation = new User { IdUser = 5, Name = "Bob" }
            };
            var deadCitizenWithChest = new TownCitizen
            {
                IdTown = 1,
                IdUser = 6,
                Dead = true,
                IdChestNavigation = new Chest
                {
                    IdChest = 11,
                    ChestItems = new List<ChestItem>
                    {
                        new ChestItem { IdChest = 11, IdItem = 3, IsBroken = false, Count = 100 }
                    }
                },
                IdUserNavigation = new User { IdUser = 6, Name = "Dead" }
            };

            var town = new Town
            {
                IdTown = 1,
                TownCitizens = new List<TownCitizen> { aliveCitizenWithChest, deadCitizenWithChest }
            };

            var mapCell = new MapCell { IdCell = 100, IdTown = 1 };
            var mapCellItem = new MapCellItem { IdCell = 100, IdItem = 3, IsBroken = false, Count = 4, IdCellNavigation = mapCell };
            item.MapCellItems = new List<MapCellItem> { mapCellItem };

            return new TownWishListItem
            {
                IdTown = 1,
                IdItem = 3,
                Count = 5,
                IdItemNavigation = item,
                IdTownNavigation = town
            };
        }

        [Fact]
        public void Map_TownWishListItemVersDto_CalculeLeCoffreEtLesObjetsSurCarte()
        {
            var dto = NewMapper().Map<WishListItemDto>(BuildWishListItem());

            dto.ChestCount.Should().Be(2);
            dto.ChestCitizens.Should().ContainSingle().Which.Should().Be("Bob");
            dto.MapCellItemCount.Should().Be(4);
        }
    }
}
