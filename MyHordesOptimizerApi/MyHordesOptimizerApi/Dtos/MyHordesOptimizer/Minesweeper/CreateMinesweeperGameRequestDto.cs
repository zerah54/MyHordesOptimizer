namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;

public sealed class CreateMinesweeperGameRequestDto
{
    public string SizeId { get; set; } = null!;
    public string Mode { get; set; } = null!;
    public int? Width { get; set; }
    public int? Height { get; set; }
    public int? MineCount { get; set; }
    public int? FirstClickX { get; set; }
    public int? FirstClickY { get; set; }
}
