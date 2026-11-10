using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.MappingProfiles.Maps;
using MyHordesOptimizerApi.Models;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MappingProfiles
{
    public class MapCellScoutVisitsMappingTests
    {
        private static IMapper NewMapper() => new MapperConfiguration(cfg => cfg.AddMaps(typeof(MapMappingProfile).Assembly), NullLoggerFactory.Instance).CreateMapper();

        [Fact]
        public void Carte_PassagesDEclaireur()
        {
            var dto = NewMapper().Map<MyHordesOptimizerCellDto>(new MapCell { IdCell = 1, X = 6, Y = 5, ScoutVisits = 7, ScoutZoneLevel = 1 });

            dto.ScoutVisits.Should().Be(7);
        }

        [Fact]
        public void Saisie_PassagesNonRecopiesParLeMapping()
        {
            // Appliqués par MapCellRadarExtensions (plafond, niveau) : le mapping ne doit pas les recopier bruts
            var cell = NewMapper().Map<MapCell>(new MyHordesOptimizerCellUpdateDto { X = 6, Y = 5, ScoutVisits = 20, Items = new(), Citizens = new() });

            cell.ScoutVisits.Should().BeNull();
        }
    }
}
