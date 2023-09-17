using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
	[Table("TownCitizen")]
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
		public bool Dead { get; set; }
		public int IdCadaver { get; set; }
		public int IdLastUpdateInfo { get; set; }
		public int? IdBag { get; set; }

		public bool? HasRescue { get; set; }
		public int? ApagCharges { get; set; }
		public bool? HasUppercut { get; set; }
		public bool? HasSecondWind { get; set; }
		public bool? HasLuckyFind { get; set; }
		public bool? HasCheatDeath { get; set; }
		public bool? HasHeroicReturn { get; set; }
		public int? HouseLevel { get; set; }
		public bool? HasAlarm { get; set; }
		public int? ChestLevel { get; set; }
		public bool? HasCurtain { get; set; }
		public int? HouseDefense { get; set; }
		public int? KitchenLevel { get; set; }
		public int? LaboLevel { get; set; }
		public int? RestLevel { get; set; }
		public bool? HasLock { get; set; }
		public bool? IsCleanBody { get; set; }
		public bool? IsCamper { get; set; }
		public bool? IsAddict { get; set; }
		public bool? IsDrugged { get; set; }
		public bool? IsDrunk { get; set; }
		public bool? IsGhoul { get; set; }
		public bool? IsQuenched { get; set; }
		public bool? IsConvalescent { get; set; }
		public bool? IsSated { get; set; }
		public bool? IsCheatingDeathActive { get; set; }
		public bool? IsHungOver { get; set; }
		public bool? IsImmune { get; set; }
		public bool? IsInfected { get; set; }
		public bool? IsTerrorised { get; set; }
		public bool? IsThirsty { get; set; }
		public bool? IsDesy { get; set; }
		public bool? IsTired { get; set; }
		public bool? IsHeadWounded { get; set; }
		public bool? IsHandWounded { get; set; }
		public bool? IsArmWounded { get; set; }
		public bool? IsLegWounded { get; set; }
		public bool? IsEyeWounded { get; set; }
		public bool? IsFootWounded { get; set; }
	}
}
