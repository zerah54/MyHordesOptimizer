using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Services.Impl.MapRoutes;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApiUnitTests.MapRoutes
{
    public class MapRoutePathTests
    {
        private const int Width = 25;
        private const int Height = 25;

        private static List<MapRoutePointDto> Cells(params (int X, int Y)[] cells)
        {
            return cells.Select(cell => new MapRoutePointDto { X = cell.X, Y = cell.Y }).ToList();
        }

        private static List<MapRouteStopDto> Stops(params (int X, int Y, string Mode)[] stops)
        {
            return stops.Select(stop => new MapRouteStopDto { X = stop.X, Y = stop.Y, Mode = stop.Mode }).ToList();
        }

        [Fact]
        public void Validate_CheminAdjacentAvecDestinationsSurLeChemin_Accepte()
        {
            var cells = Cells((12, 12), (13, 12), (13, 11), (13, 10));
            var stops = Stops((13, 12, MapRouteStopModes.L), (13, 10, MapRouteStopModes.Best));

            Action act = () => MapRoutePath.Validate(cells, stops, Width, Height);

            act.Should().NotThrow();
        }

        [Fact]
        public void Validate_UneSeuleCase_Refuse()
        {
            Action act = () => MapRoutePath.Validate(Cells((12, 12)), Stops(), Width, Height);

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void Validate_CasesNull_Refuse()
        {
            Action act = () => MapRoutePath.Validate(null, Stops(), Width, Height);

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void Validate_DiagonaleEntreDeuxCases_Refuse()
        {
            Action act = () => MapRoutePath.Validate(Cells((12, 12), (13, 13)), Stops(), Width, Height);

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void Validate_MemeCaseDeuxFoisDeSuite_Refuse()
        {
            Action act = () => MapRoutePath.Validate(Cells((12, 12), (12, 12)), Stops(), Width, Height);

            act.Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData(-1, 0)]
        [InlineData(0, -1)]
        [InlineData(Width, 0)]
        [InlineData(0, Height)]
        public void Validate_CaseHorsCarte_Refuse(int x, int y)
        {
            var neighbourX = x < 0 ? 0 : x >= Width ? Width - 1 : x;
            var neighbourY = y < 0 ? 0 : y >= Height ? Height - 1 : y;

            Action act = () => MapRoutePath.Validate(Cells((neighbourX, neighbourY), (x, y)), Stops(), Width, Height);

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void Validate_DestinationHorsDuChemin_Refuse()
        {
            Action act = () => MapRoutePath.Validate(Cells((12, 12), (13, 12)), Stops((14, 12, MapRouteStopModes.Best)), Width, Height);

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void Validate_ModeInconnu_Refuse()
        {
            Action act = () => MapRoutePath.Validate(Cells((12, 12), (13, 12)), Stops((13, 12, "zigzag")), Width, Height);

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void Validate_DimensionsInconnues_Refuse()
        {
            Action act = () => MapRoutePath.Validate(Cells((0, 0), (1, 0)), Stops(), 0, 0);

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void NormalizeLabel_RetireLesEspacesDeBord_GardeLesCaracteresSpeciaux()
        {
            MapRoutePath.NormalizeLabel("  Vers l'Ouest 🧟 « nord »  ").Should().Be("Vers l'Ouest 🧟 « nord »");
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void NormalizeLabel_Vide_Refuse(string? label)
        {
            Action act = () => MapRoutePath.NormalizeLabel(label);

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void NormalizeLabel_TropLong_Refuse()
        {
            Action act = () => MapRoutePath.NormalizeLabel(new string('a', MapRoutePath.MaxLabelLength + 1));

            act.Should().Throw<MhoTechnicalException>();
        }
    }
}
