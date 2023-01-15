namespace MyHordesOptimizerApi.Models.Map
{
    public class MapCellDigModel
    {
        public int IdCell { get; set; }
        public int IdUser { get; set; }
        public int IdLastUpdateInfo { get; set; }
        public int Day { get; set; }
        public int NbSucces { get; set; }
        public int NbTotalDig { get; set; }
    }
}
