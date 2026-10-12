using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Services.Impl.MapRoutes;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApiUnitTests.MapRoutes
{
    public class MapRouteJsonTests
    {
        [Fact]
        public void Points_AllerRetour_FormatCompact()
        {
            var points = new List<MapRoutePointDto> { new() { X = 1, Y = 2 }, new() { X = 3, Y = 4 } };

            var json = MapRouteJson.SerializePoints(points);

            json.Should().Be("[[1,2],[3,4]]");
            MapRouteJson.ParsePoints(json).Should().BeEquivalentTo(points, options => options.WithStrictOrdering());
        }

        [Fact]
        public void Stops_AllerRetour()
        {
            var stops = new List<MapRouteStopDto> { new() { X = 1, Y = 2, Mode = MapRouteStopModes.L }, new() { X = 3, Y = 4, Mode = MapRouteStopModes.Best } };

            var json = MapRouteJson.SerializeStops(stops);

            json.Should().Be("[{\"x\":1,\"y\":2,\"mode\":\"l\"},{\"x\":3,\"y\":4,\"mode\":\"best\"}]");
            MapRouteJson.ParseStops(json).Should().BeEquivalentTo(stops, options => options.WithStrictOrdering());
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("pas du json")]
        [InlineData("{\"x\":1}")]
        public void Parse_ValeurIllisible_ListeVide(string? json)
        {
            MapRouteJson.ParsePoints(json).Should().BeEmpty();
            MapRouteJson.ParseStops(json).Should().BeEmpty();
        }

        [Fact]
        public void ParsePoints_PaireIncomplete_Ignoree()
        {
            MapRouteJson.ParsePoints("[[1,2],[3],[4,5,6],[7,8]]")
                .Select(point => (point.X, point.Y))
                .Should().Equal((1, 2), (7, 8));
        }

        [Fact]
        public void Palette_PickRandom_ToujoursUneCleValide()
        {
            Enumerable.Range(0, 100).Select(_ => MapRoutePalette.PickRandom()).Should().OnlyContain(color => MapRoutePalette.IsValid(color));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("#ff0000")]
        [InlineData("BLUE")]
        public void Palette_IsValid_RefuseCeQuiNEstPasUneCle(string? color)
        {
            MapRoutePalette.IsValid(color).Should().BeFalse();
        }
    }
}
