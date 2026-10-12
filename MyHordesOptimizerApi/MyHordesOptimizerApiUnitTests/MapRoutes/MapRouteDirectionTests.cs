using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Services.Impl.MapRoutes;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApiUnitTests.MapRoutes
{
    public class MapRouteDirectionTests
    {
        private static List<MapRoutePointDto> Cells(params (int X, int Y)[] cells)
        {
            return cells.Select(cell => new MapRoutePointDto { X = cell.X, Y = cell.Y }).ToList();
        }

        [Fact]
        public void FirstCell_VersLeNord_YAbsoluDecroissant()
        {
            // y absolu décroissant = nord.
            var cells = Cells((12, 12), (12, 11), (12, 10), (12, 9));

            MapRouteDirection.FirstCell(cells).Should().Be(DirectionEnum.North);
        }

        [Fact]
        public void FirstCell_IgnoreLaSuiteDuTrace()
        {
            // Boucle : 2 cases à l'est, puis 4 au sud-est en revenant ; la case la plus éloignée serait au sud-est.
            var cells = Cells((12, 12), (13, 12), (14, 12), (14, 13), (14, 14), (15, 14), (15, 15), (14, 15));

            MapRouteDirection.FirstCell(cells).Should().Be(DirectionEnum.Est);
        }

        [Fact]
        public void FirstCell_TraceSansLaVilleEnTete_PremierDeplacementDuTrace()
        {
            // Tracé démarrant hors de la ville, en (14, 10) : le premier déplacement va vers le nord, pas vers le nord-est.
            var cells = Cells((14, 10), (14, 9), (14, 8));

            MapRouteDirection.FirstCell(cells).Should().Be(DirectionEnum.North);
        }

        [Fact]
        public void FirstCell_TraceSansLaVilleEnTete_IgnoreLesCasesRepetees()
        {
            var cells = Cells((14, 10), (14, 10), (13, 10));

            MapRouteDirection.FirstCell(cells).Should().Be(DirectionEnum.West);
        }

        [Fact]
        public void FirstCell_UneSeuleCaseHorsDeLaVille_Null()
        {
            MapRouteDirection.FirstCell(Cells((14, 10))).Should().BeNull();
        }

        [Fact]
        public void FirstCell_SansQuitterLaVille_Null()
        {
            MapRouteDirection.FirstCell(Cells((12, 12))).Should().BeNull();
        }
    }
}
