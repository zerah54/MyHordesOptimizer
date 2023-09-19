using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
	[Table("TownCadaver")]
	public class TownCadaverModel
	{
		[Key]
		[Column("idCadaver")]
		public int IdCadaver { get; set; }
		[Column("idCitizen")]
		public int IdCitizen { get; set; }
		[Column("idLastUpdateInfo")]
		public int IdLastUpdateInfo { get; set; }
		[Column("cadaverName")]
		public string Name { get; set; }
		[Column("avatar")]
		public string Avatar { get; set; }
		[Column("survivalDays")]
		public int Survival { get; set; }
		[Column("score")]
		public int Score { get; set; }
		[Column("deathMessage")]
		public string Msg { get; set; }
		public string TownMsg { get; set; }
		public CauseOfDeathModel CauseOfDeath { get; set; }
		public CleanUpModel CleanUp { get; set; }
	}
}
