using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;

public sealed class MinesweeperLeaderboardPageDto
{
    public List<MinesweeperLeaderboardEntryDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
}
