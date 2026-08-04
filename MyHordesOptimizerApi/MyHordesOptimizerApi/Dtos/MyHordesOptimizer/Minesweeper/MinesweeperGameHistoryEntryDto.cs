using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;

public sealed class MinesweeperGameHistoryEntryDto
{
    public int GameId { get; set; }
    public string SizeId { get; set; } = null!;
    public int Width { get; set; }
    public int Height { get; set; }
    public int MineCount { get; set; }
    public string Mode { get; set; } = null!;
    public string Status { get; set; } = null!;
    public int? ElapsedMs { get; set; }
    public DateTime CreatedAt { get; set; }
}
