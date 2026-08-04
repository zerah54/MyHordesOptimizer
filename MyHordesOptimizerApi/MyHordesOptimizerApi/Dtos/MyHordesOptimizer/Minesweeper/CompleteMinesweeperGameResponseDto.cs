namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;

public sealed class CompleteMinesweeperGameResponseDto
{
    public string Outcome { get; set; } = null!;
    public int? ElapsedMs { get; set; }
    public bool Scored { get; set; }
}
