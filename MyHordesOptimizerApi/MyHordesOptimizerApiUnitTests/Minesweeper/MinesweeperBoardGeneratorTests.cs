using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Interfaces;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Minesweeper
{
    /// <summary>
    /// Vecteurs de référence capturés en exécutant minesweeper-generator.util.ts (le générateur
    /// front actuel) pour les mêmes paramètres. Toute divergence ici signifie que le port C# ne
    /// produit plus EXACTEMENT le même plateau que l'algorithme d'origine pour un seed donné — ce qui
    /// casserait la garantie "résolvable sans devinette" sur laquelle repose tout le jeu.
    /// </summary>
    public class MinesweeperBoardGeneratorTests
    {
        private readonly IMinesweeperBoardGenerator _generator = new MinesweeperBoardGenerator();

        [Fact]
        public void Tiny5x5_MatchesReferenceVector()
        {
            var board = _generator.Generate(5, 5, 3, 2, 2, 12345);

            MineIndices(board.Mines).Should().Equal(5, 14, 24);
            board.AdjacentCounts.Should().Equal(
                1, 1, 0, 0, 0,
                0, 1, 0, 1, 1,
                1, 1, 0, 1, 0,
                0, 0, 0, 2, 2,
                0, 0, 0, 1, 0);
        }

        [Fact]
        public void Small9x9_CornerStart_MatchesReferenceVector()
        {
            var board = _generator.Generate(9, 9, 10, 0, 0, 999);

            MineIndices(board.Mines).Should().Equal(13, 24, 29, 41, 50, 51, 53, 64, 70, 78);
        }

        [Fact]
        public void Medium16x16_MatchesReferenceVector()
        {
            var board = _generator.Generate(16, 16, 40, 8, 8, 42);

            MineIndices(board.Mines).Should().Equal(
                2, 18, 26, 30, 32, 34, 38, 43, 46, 47, 59, 67, 69, 71, 83, 84, 102, 111, 124, 129,
                133, 134, 138, 142, 150, 157, 163, 164, 165, 166, 172, 175, 183, 196, 208, 215, 219,
                222, 223, 228);
        }

        [Fact]
        public void DensePerturbation_8x8_MatchesReferenceVector()
        {
            // Densité 30/64 (46.9%) : force le solveur à passer par le chemin de perturbation
            // ("deviner puis corriger") de nombreuses fois. C'est le cas qui a révélé le bug d'ordre
            // d'énumération de SetStore — le garder est ce qui protège contre une régression.
            var board = _generator.Generate(8, 8, 30, 4, 4, 7);

            MineIndices(board.Mines).Should().Equal(
                0, 5, 8, 12, 13, 14, 15, 16, 20, 21, 23, 26, 30, 31, 32, 33, 34, 39, 40, 42, 46, 47,
                51, 52, 53, 55, 60, 61, 62, 63);
        }

        [Fact]
        public void DailyLike_16x16_CenterStart_MatchesReferenceVector()
        {
            // Représentatif du défi quotidien : démarrage forcé au centre de la grille.
            var board = _generator.Generate(16, 16, 40, 8, 8, 20260803);

            MineIndices(board.Mines).Should().Equal(
                5, 10, 13, 25, 28, 29, 37, 44, 47, 49, 51, 59, 63, 71, 82, 85, 86, 87, 97, 106, 109,
                129, 142, 148, 150, 156, 167, 168, 175, 183, 185, 190, 191, 193, 214, 216, 229, 230,
                237, 240);
        }

        [Theory]
        [InlineData(9, 9, 10, 4, 4, 1u)]
        [InlineData(16, 16, 40, 8, 8, 42u)]
        [InlineData(8, 8, 30, 4, 4, 7u)]
        public void GeneratedBoard_AlwaysHasExactMineCountAndSafeStartZone(int width, int height, int mines, int startX, int startY, uint seed)
        {
            var board = _generator.Generate(width, height, mines, startX, startY, seed);

            MineIndices(board.Mines).Should().HaveCount(mines);

            for (int dy = -1; dy <= 1; dy++)
            {
                for (int dx = -1; dx <= 1; dx++)
                {
                    int x = startX + dx;
                    int y = startY + dy;
                    if (x < 0 || x >= width || y < 0 || y >= height) continue;
                    board.Mines[y * width + x].Should().Be(0, "la zone 3x3 autour du premier clic doit toujours être sûre");
                }
            }
        }

        private static int[] MineIndices(byte[] mines)
        {
            return mines.Select((v, i) => (v, i)).Where(t => t.v == 1).Select(t => t.i).ToArray();
        }
    }
}
