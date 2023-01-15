using System;

namespace MyHordesOptimizerApi.Models.Map
{
    public class MapCellCompletModel
    {
        public int IdCell { get; set; }
        public int IdTown { get; set; }
        public int IdLastUpdateInfo { get; set; }
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
        public DateTime LastUpdateDateUpdate { get; set; }
        public string LastUpdateInfoUserName { get; set; }
        public int LastUpdateInfoUserId { get; set; }
        public int TownX { get; set; }
        public int TownY { get; set; }
        public int MapHeight { get; set; }
        public int MapWidth { get; set; }
        public bool IsChaos { get; set; }
        public bool IsDevasted { get; set; }
        public bool IsDoorOpen { get; set; }
        public int WaterWell { get; set; }
        public int Day { get; set; }
        public int? ItemId { get; set; }
        public int? ItemCount { get; set; }
        public bool? IsItemBroken { get; set; }
        public string CitizenName { get; set; }
        public int? CitizenId { get; set; }
    }
}
