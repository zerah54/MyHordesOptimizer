namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map
{
    public class MyHordesOptimizerMapDigDto
    {
        public int CellId { get; set; }
        public int DiggerId { get; set; }
        public string? DiggerName { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int Day { get; set; }
        public int NbSucces { get; set; }
        public int NbTotalDig { get; set; }
        public LastUpdateInfoDto? LastUpdateInfo { get; set; }
    }
}
