using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map
{
    public class MyHordesOptimizerMapDto
    {
        public int TownId { get; set; }
        public int TownX { get; set; }
        public int TownY { get; set; }
        public int MapHeight { get; set; }
        public int MapWidth { get; set; }
        public bool IsChaos { get; set; }
        public bool IsDevasted { get; set; }
        public bool IsDoorOpen { get; set; }
        public int WaterWell { get; set; }
        public int Day { get; set; }

        public List<MyHordesOptimizerCellDto> Cells { get; set; }

        public MyHordesOptimizerMapDto()
        {
            Cells = new List<MyHordesOptimizerCellDto>();
        }
    }
}
