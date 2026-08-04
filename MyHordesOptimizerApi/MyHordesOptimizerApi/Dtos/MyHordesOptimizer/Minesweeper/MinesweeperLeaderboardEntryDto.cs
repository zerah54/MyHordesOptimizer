using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;

public sealed class MinesweeperLeaderboardEntryDto
{
    public int Rank { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string? Avatar { get; set; }
    public int ElapsedMs { get; set; }
    public DateTime AchievedAt { get; set; }
}
