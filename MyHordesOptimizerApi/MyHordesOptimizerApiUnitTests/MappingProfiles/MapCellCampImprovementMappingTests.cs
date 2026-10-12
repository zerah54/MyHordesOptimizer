using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.MappingProfiles.Maps;
using MyHordesOptimizerApi.Models;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MappingProfiles
{
    public class MapCellCampImprovementMappingTests
    {
        [Fact]
        public void Carte_AmenagementAuJourDeLaVille()
        {
            var mapper = new MapperConfiguration(cfg => cfg.AddMaps(typeof(MapMappingProfile).Assembly), NullLoggerFactory.Instance).CreateMapper();
            var town = new Town
            {
                IdTown = 1,
                X = 5,
                Y = 5,
                Day = 7,
                MapCells = new List<MapCell>
                {
                    new MapCell { IdCell = 1, X = 6, Y = 5, IsTown = false, CampImprovementLevel = 40, CampImprovementDay = 6 },
                    new MapCell { IdCell = 2, X = 7, Y = 5, IsTown = false }
                }
            };

            var cells = mapper.Map<List<MyHordesOptimizerCellDto>>(town);

            var improved = cells.Single(cell => cell.X == 6);
            improved.CampImprovementLevel.Should().Be(25);
            improved.CampImprovementDay.Should().Be(6);
            cells.Single(cell => cell.X == 7).CampImprovementLevel.Should().BeNull();
        }
    }
}
