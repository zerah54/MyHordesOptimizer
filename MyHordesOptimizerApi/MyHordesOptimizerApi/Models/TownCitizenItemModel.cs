namespace MyHordesOptimizerApi.Models
{
    public class TownCitizenItemModel
    {
		public int IdTown { get; set; }
		public int IdUser { get; set; }
		public int IdItem { get; set; }
		public int IdLastUpdateInfo { get; set; }
		public int Count { get; set; }
		public bool IsBroken { get; set; }
	}
}
