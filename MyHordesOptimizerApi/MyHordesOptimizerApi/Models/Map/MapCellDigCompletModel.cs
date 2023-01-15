using System;

namespace MyHordesOptimizerApi.Models.Map
{
    public class MapCellDigCompletModel
    {
        public int CellId { get; set; }
        public int DiggerId { get; set; }
        public string DiggerName { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int Day { get; set; }
        public int NbSucces { get; set; }
        public int NbTotalDig { get; set; }
        public DateTime LastUpdateDateUpdate { get; set; }
        public string LastUpdateInfoUserName { get; set; }
        public int LastUpdateInfoUserId { get; set; }
    }
}
