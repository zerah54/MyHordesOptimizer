using FluentAssertions;
using MyHordesOptimizerApi.Data.Citizens;
using MyHordesOptimizerApi.Services.Impl.Citizens;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Citizens
{
    public class HomeReferentialMapperTests
    {
        [Fact]
        public void Map_UsesTheIndexAsLevelAndFlattensResources()
        {
            var levels = new List<HomeLevelCodeModel>
            {
                new() { Label = "Feldbett", Icon = "home_lv0" },
                new() { Label = "Baracke", Icon = "home_lv2", Def = 4, Ap = 4, ApUrbanism = 3, Resources = new() { { "wood_bad_#00", 1 } }, Upgrades = true }
            };

            var dto = HomeReferentialMapper.Map(levels, new List<HomeUpgradeCodeModel>());

            dto.Levels.Select(level => level.Level).Should().Equal(0, 1);
            dto.Levels[0].Resources.Should().BeEmpty();
            dto.Levels[1].ApUrbanism.Should().Be(3);
            dto.Levels[1].AllowsUpgrades.Should().BeTrue();
            dto.Levels[1].Resources.Should().ContainSingle(resource => resource.ItemUid == "wood_bad_#00" && resource.Count == 1);
        }

        [Fact]
        public void Map_SortsUpgradeLevelsNumerically()
        {
            var upgrades = new List<HomeUpgradeCodeModel>
            {
                new()
                {
                    Name = "lab", Label = "Hobbylabor", Desc = "d",
                    Levels = new()
                    {
                        { "10", new HomeUpgradeLevelCodeModel { Ap = 20 } },
                        { "2", new HomeUpgradeLevelCodeModel { Ap = 9 } },
                        { "1", new HomeUpgradeLevelCodeModel { Ap = 6, Resources = new() { { "machine_1_#00", 1 } } } }
                    }
                }
            };

            var dto = HomeReferentialMapper.Map(new List<HomeLevelCodeModel>(), upgrades);

            dto.Upgrades.Single().Levels.Select(level => level.Level).Should().Equal(1, 2, 10);
            dto.Upgrades.Single().Levels[0].Resources.Should().ContainSingle(resource => resource.ItemUid == "machine_1_#00");
            dto.Upgrades.Single().Description.Should().Be("d");
        }
    }
}
