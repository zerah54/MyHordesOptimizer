using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;

public sealed class MinesweeperGameStartedDto
{
    public int GameId { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public int MineCount { get; set; }
    public int[] Mines { get; set; } = Array.Empty<int>();
    public int[] AdjacentCounts { get; set; } = Array.Empty<int>();
    public bool TimerStarted { get; set; }
    public int FirstClickX { get; set; }
    public int FirstClickY { get; set; }
    public DateTime? StartedAt { get; set; }
}
