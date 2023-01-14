using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map
{
    public class MyHordesOptimizerCellDto
    {
        public int CellId { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public bool IsTown { get; set; }
        public bool IsVisitedToday { get; set; }
        public int DangerLevel { get; set; }
        public int? IdRuin { get; set; }
        public bool IsDryed { get; set; }
        public int? NbZombie { get; set; }
        public int? NbZombieKilled { get; set; }
        public int? NbHero { get; set; }
        public bool? IsRuinCamped { get; set; }
        public bool? IsRuinDryed { get; set; }
        public int? NbRuinDig { get; set; }
        public int? TodayNbDigSucces { get; set; }
        public int? PreviousDayTotalNbDigSucces { get; set; }
        public double? AveragePotentialRemainingDig { get; set; }
        public int? MaxPotentialRemainingDig { get; set; }

        public LastUpdateInfo? LastUpdateInfo { get; set; }
    }
}
