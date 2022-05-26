namespace MyHordesOptimizerApi.Models
{
    public class Citizen
    {
		public int IdCitizen { get; set; }
		public string CitizenName { get; set; }
		public string HomeMessage { get; set; }
		public string JobName { get; set; }
		public string JobUID { get; set; }
		public int PositionX { get; set; }
		public int positionY { get; set; }
		public bool IsGhost { get; set; }

	}
}
