using System;

namespace MyHordesOptimizerApi.Models.Views.Citizens
{
    public class TownCitizenCompletModel
    {
		public int TownId { get; set; }
		public int CitizenId { get; set; }
		public string CitizenName { get; set; }
		public string CitizenHomeMessage { get; set; }
		public string CitizenJobName { get; set; }
		public string CitizenJobUID { get; set; }
		public int CitizenPositionX { get; set; }
		public int CitizenPositionY { get; set; }
		public bool CitizenIsGhost { get; set; }
		public int LastUpdateInfoId { get; set; }
		public int LastUpdateInfoUserId { get; set; }
		public DateTime LastUpdateDateUpdate { get; set; }
		public string LastUpdateInfoUserName { get; set; }
	}
}
