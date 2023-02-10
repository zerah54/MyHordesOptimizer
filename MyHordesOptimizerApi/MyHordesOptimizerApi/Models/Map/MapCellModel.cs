namespace MyHordesOptimizerApi.Models.Map
{
    public class MapCellModel
    {
        public int IdCell { get; set; }
        public int IdTown { get; set; }
        public int IdLastUpdateInfo { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public bool IsTown { get; set; }
        public bool IsVisitedToday { get; set; }
        public bool IsNeverVisited { get; set; }
        public int? DangerLevel { get; set; }
        public int? IdRuin { get; set; }
        public bool? IsDryed { get; set; }
        public int? NbZombie { get; set; }
        public int? NbZombieKilled { get; set; }
        public int? NbHero { get; set; }
        public bool? IsRuinCamped { get; set; }
        public bool? IsRuinDryed { get; set; }
        public int? NbRuinDig { get; set; }
        public double? AveragePotentialRemainingDig { get; set; }
        public int? MaxPotentialRemainingDig { get; set; }
        public int? NbKm { get; set; }
        public int? NbPa { get; set; }
        public int? ZoneRegen { get; set; }
        public string Note { get; set; }
    }
}
