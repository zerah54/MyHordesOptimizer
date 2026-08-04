namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;

public sealed class MinesweeperChallengeStatusDto
{
    public string SizeId { get; set; } = null!;
    public bool AlreadyPlayedToday { get; set; }
}
