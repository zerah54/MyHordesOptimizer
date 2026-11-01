namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class RuineOptiPathRequestDto
    {
        public short[][] Map { get; set; } = null!;
        public RuineCellDto[] Doors { get; set; } = null!;
        public RuineCellDto Entrance { get; set; } = null!;
    }

    public class RuineCellDto
    {
        public int RowIndex { get; set; }
        public int ColIndex { get; set; }
    }
}
