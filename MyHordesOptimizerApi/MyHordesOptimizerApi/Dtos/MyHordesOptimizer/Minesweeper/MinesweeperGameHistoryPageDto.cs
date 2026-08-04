using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;

public sealed class MinesweeperGameHistoryPageDto
{
    public List<MinesweeperGameHistoryEntryDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
}
