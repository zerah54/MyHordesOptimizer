namespace MyHordesOptimizerApi.Services.Interfaces;

public interface IMinesweeperBoardGenerator
{
    GeneratedMinesweeperBoard Generate(int width, int height, int mineCount, int startX, int startY, uint seed);
}

public sealed class GeneratedMinesweeperBoard
{
    public required byte[] Mines { get; init; }
    public required byte[] AdjacentCounts { get; init; }
    public int Width { get; init; }
    public int Height { get; init; }
}
