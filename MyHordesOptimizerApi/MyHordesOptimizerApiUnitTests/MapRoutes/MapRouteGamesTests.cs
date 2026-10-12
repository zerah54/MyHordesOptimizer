using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes.Request;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.MapRoutes;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MapRoutes
{
    public class MapRouteGamesTests
    {
        private static MyHordesExpeditionDto Expedition(string? name, int[] xs, int[] ys, int? authorId = null, int? length = null)
        {
            return new MyHordesExpeditionDto
            {
                Name = name,
                Length = length,
                Author = authorId.HasValue ? new MyHordesExpeditionAuthorDto { Id = authorId } : null,
                Points = new MyHordesExpeditionPointsDto { X = xs.ToList(), Y = ys.ToList() }
            };
        }

        [Fact]
        public void FromMyHordes_GardeLesItinerairesValides()
        {
            var expeditions = new List<MyHordesExpeditionDto?>
            {
                Expedition("  Nord  ", new[] { 5, 5, 7 }, new[] { 5, 3, 3 }, authorId: 12),
                Expedition("Inconnu", new[] { 5, 5 }, new[] { 5, 4 }, authorId: 99, length: 1),
                Expedition("", new[] { 5, 5 }, new[] { 5, 4 }),
                Expedition("Un seul point", new[] { 5 }, new[] { 5 }),
                Expedition("Tableaux inégaux", new[] { 5, 5 }, new[] { 5 }),
                Expedition("Hors carte", new[] { 5, 25 }, new[] { 5, 5 }),
                null
            };

            var gameRoutes = MapRouteGames.FromMyHordes(expeditions, idTown: 3, day: 4, mapWidth: 20, mapHeight: 20, new HashSet<int> { 12 }, idLastUpdateInfo: 8);

            gameRoutes.Select(gameRoute => gameRoute.Label).Should().Equal("Nord", "Inconnu");
            gameRoutes[0].IdTown.Should().Be(3);
            gameRoutes[0].Day.Should().Be(4);
            gameRoutes[0].IdAuthor.Should().Be(12);
            gameRoutes[0].Length.Should().Be(4);
            gameRoutes[0].Stops.Should().Be("[[5,5],[5,3],[7,3]]");
            gameRoutes[0].IdLastUpdateInfo.Should().Be(8);
            gameRoutes[1].IdAuthor.Should().BeNull();
            gameRoutes[1].Length.Should().Be(1);
        }

        [Fact]
        public void FromMyHordes_TronqueLeNomA32Caracteres()
        {
            var gameRoutes = MapRouteGames.FromMyHordes(new[] { Expedition(new string('a', 40), new[] { 1, 1 }, new[] { 1, 2 }) }, 1, 1, 10, 10, new HashSet<int>(), null);

            gameRoutes[0].Label.Should().HaveLength(MapRouteGames.MaxLabelLength);
        }

        [Fact]
        public void ExpandStops_RelieLesPointsEnLigneDroite_LHorizontaleDAbord()
        {
            var cells = MapRouteGames.ExpandStops(new List<MapRoutePointDto> { new() { X = 0, Y = 0 }, new() { X = 2, Y = 1 } });

            cells.Select(cell => (cell.X, cell.Y)).Should().Equal((0, 0), (1, 0), (2, 0), (2, 1));
        }

        [Fact]
        public void ToRouteRequest_ReprendLesCasesEtFaitDesPointsDesDestinations()
        {
            var gameRoute = new MapRouteGame { Label = "Boucle", Stops = "[[5,5],[5,3],[5,3],[5,5]]" };

            MapRouteRequestDto request = MapRouteGames.ToRouteRequest(gameRoute);

            request.Id.Should().BeNull();
            request.Label.Should().Be("Boucle");
            request.IsPrivate.Should().BeFalse();
            request.IsEditableByAll.Should().BeTrue();
            request.Cells.Select(cell => (cell.X, cell.Y)).Should().Equal((5, 5), (5, 4), (5, 3), (5, 4), (5, 5));
            request.Stops.Select(stop => (stop.X, stop.Y, stop.Mode)).Should().Equal((5, 3, MapRouteStopModes.L), (5, 5, MapRouteStopModes.L));
        }
    }
}
