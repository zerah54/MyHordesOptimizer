namespace MyHordesOptimizerApi.Models
{
    public class TownCitizenModel
    {
		public int IdTown { get; set; }
		public int IdUser { get; set; }
		public string HomeMessage { get; set; }
		public string JobName { get; set; }
		public string JobUID { get; set; }
		public string Avatar { get; set; }
		public int PositionX { get; set; }
		public int PositionY { get; set; }
		public bool IsGhost { get; set; }
		public int IdLastUpdateInfo { get; set; }
	}
}
