using System.Collections.Generic;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Bag;
using MyHordesOptimizerApi.MappingProfiles.Citizens;
using MyHordesOptimizerApi.Models;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MappingProfiles
{
    public class CitizenChestMappingTests
    {
        private static IMapper NewMapper()
        {
            var config = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<CitizenMappingProfile>();
            }, NullLoggerFactory.Instance);
            return config.CreateMapper();
        }

        [Fact]
        public void Map_ChestVersBagDto_ReprendLesItems()
        {
            var chest = new Chest
            {
                IdChest = 7,
                ChestItems = new List<ChestItem>
                {
                    new ChestItem { IdChest = 7, IdItem = 3, IsBroken = false, Count = 2 }
                }
            };

            var dto = NewMapper().Map<BagDto>(chest);

            dto.IdBag.Should().Be(7);
            dto.Items.Should().ContainSingle();
        }
    }
}
