namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class RuineOptiPathRequestDto
    {
        public short[][] Map { get; set; }
        public RuineCellDto[] Doors { get; set; }
        public RuineCellDto Entrance { get; set; }
    }

    public class RuineCellDto
    {
        public int RowIndex { get; set; }
        public int ColIndex { get; set; }
    }
}
