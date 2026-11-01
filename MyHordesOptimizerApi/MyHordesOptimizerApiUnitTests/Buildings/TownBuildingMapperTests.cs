using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Services.Impl.Buildings;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Buildings
{
    public class TownBuildingMapperTests
    {
        private static readonly Dictionary<int, int> Buildings = new() { { 10, 100 }, { 11, 101 } };
        private static readonly Dictionary<int, int> Items = new() { { 5, 500 } };

        private static MyHordesCity City(List<MyHordesBuildingDto>? chantiers, List<MyHordesBuildingDto>? buildings)
            => new() { Chantiers = chantiers, Buildings = buildings };

        [Fact]
        public void Map_SetsIsBuiltFromWhichListTheBuildingIsIn()
        {
            var city = City(
                new() { new MyHordesBuildingDto { Id = 10, PaCurrent = 40, Actions = 12, Def = 0, MaxLife = 30, Life = 30, HasLevels = 0, Difficulty = 1 } },
                new() { new MyHordesBuildingDto { Id = 11, PaCurrent = 20, Actions = 0, Def = 15, MaxLife = 50, Life = 40, HasLevels = 2 } });

            var rows = TownBuildingMapper.Map(city, Buildings, Items, _ => { });

            rows.Should().HaveCount(2);
            var planned = rows.Single(row => row.IdBuilding == 100);
            planned.IsBuilt.Should().BeFalse();
            planned.PaCurrent.Should().Be(40);
            planned.ApRemaining.Should().Be(12);
            planned.Difficulty.Should().Be(1);
            var built = rows.Single(row => row.IdBuilding == 101);
            built.IsBuilt.Should().BeTrue();
            built.Life.Should().Be(40);
            built.MaxLife.Should().Be(50);
            built.Def.Should().Be(15);
            built.Level.Should().Be(2);
        }

        [Fact]
        public void Map_LeavesFieldsNullWhenTheApiOmitsThem()
        {
            var city = City(new() { new MyHordesBuildingDto { Id = 10 } }, null);

            var row = TownBuildingMapper.Map(city, Buildings, Items, _ => { }).Single();

            row.PaCurrent.Should().BeNull();
            row.ApRemaining.Should().BeNull();
            row.Difficulty.Should().BeNull();
            row.ResourcesCurrent.Should().BeNull();
        }

        [Fact]
        public void Map_IgnoresUnknownBuildingAndReportsIt()
        {
            var unknown = new List<int>();
            var city = City(new() { new MyHordesBuildingDto { Id = 999 }, new MyHordesBuildingDto { Id = 10 } }, null);

            var rows = TownBuildingMapper.Map(city, Buildings, Items, unknown.Add);

            rows.Should().ContainSingle().Which.IdBuilding.Should().Be(100);
            unknown.Should().Equal(999);
        }

        [Fact]
        public void Map_SerializesKnownResourcesAndDropsUnknownItems()
        {
            var city = City(new()
            {
                new MyHordesBuildingDto
                {
                    Id = 10,
                    ResourcesCurrent = new()
                    {
                        new MyHordesResourceRoot { Amount = 3, Rsc = new MyHordesResource { Id = 5 } },
                        new MyHordesResourceRoot { Amount = 1, Rsc = new MyHordesResource { Id = 77 } },
                        new MyHordesResourceRoot { Amount = null, Rsc = new MyHordesResource { Id = 5 } }
                    }
                }
            }, null);

            var row = TownBuildingMapper.Map(city, Buildings, Items, _ => { }).Single();

            row.ResourcesCurrent.Should().Be("[{\"itemId\":500,\"count\":3}]");
        }

        [Fact]
        public void Map_ReturnsEmptyWhenCityIsNull()
        {
            TownBuildingMapper.Map(null, Buildings, Items, _ => { }).Should().BeEmpty();
        }

        [Fact]
        public void BuildLookup_UsesMhIdWhenPresentAndFallsBackToTheOwnKey()
        {
            var lookup = TownBuildingMapper.BuildLookup(new (int? MhId, int Id)[] { (10, 100), (null, 7) }, _ => { });

            lookup.Should().Equal(new Dictionary<int, int> { { 10, 100 }, { 7, 7 } });
        }

        [Fact]
        public void BuildLookup_LetsAnExplicitMhIdWinOverAFallbackKeyCollision()
        {
            var collisions = new List<int>();

            // La ligne 5 (sans MhId) retombe sur la clé 5, déjà prise par la ligne 9 dont le MhId est 5.
            var lookup = TownBuildingMapper.BuildLookup(new (int? MhId, int Id)[] { (null, 5), (5, 9) }, collisions.Add);

            lookup[5].Should().Be(9);
            collisions.Should().Equal(5);
        }

        [Fact]
        public void BuildLookup_KeepsTheFirstOfTwoIdenticalMhIds()
        {
            var collisions = new List<int>();

            var lookup = TownBuildingMapper.BuildLookup(new (int? MhId, int Id)[] { (3, 30), (3, 31) }, collisions.Add);

            lookup[3].Should().Be(30);
            collisions.Should().Equal(3);
        }
    }
}
