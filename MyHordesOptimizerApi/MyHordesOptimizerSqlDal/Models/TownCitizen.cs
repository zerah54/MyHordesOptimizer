using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdTown", "IdUser", "IdLastUpdateInfo")]
[Table("TownCitizen")]
[Index("IdBag", Name = "idBag")]
[Index("IdLastUpdateInfo", Name = "idLastUpdateInfo")]
[Index("IdLastUpdateInfoGhoulStatus", Name = "idLastUpdateInfoGhoulStatus")]
[Index("IdLastUpdateInfoHeroicAction", Name = "idLastUpdateInfoHeroicAction")]
[Index("IdLastUpdateInfoHome", Name = "idLastUpdateInfoHome")]
[Index("IdLastUpdateInfoStatus", Name = "idLastUpdateInfoStatus")]
[Index("IdTown", "IdUser", Name = "idTown", IsUnique = true)]
[Index("IdUser", Name = "idUser")]
public partial class TownCitizen
{
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Key]
    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Column("homeMessage", TypeName = "text")]
    public string? HomeMessage { get; set; }

    [Column("jobName", TypeName = "text")]
    public string? JobName { get; set; }

    [Column("jobUID")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? JobUid { get; set; }

    [Column("positionX", TypeName = "int(11)")]
    public int? PositionX { get; set; }

    [Column("positionY", TypeName = "int(11)")]
    public int? PositionY { get; set; }

    [Column("isGhost")]
    public bool? IsGhost { get; set; }

    [Column("dead")]
    public bool? Dead { get; set; }

    [Column("isShunned")]
    public bool? IsShunned { get; set; }

    [Key]
    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int IdLastUpdateInfo { get; set; }

    [Column("avatar")]
    [StringLength(255)]
    public string? Avatar { get; set; }

    [Column("idBag", TypeName = "int(11)")]
    public int? IdBag { get; set; }

    [Column("hasRescue")]
    public bool? HasRescue { get; set; }

    [Column("APAGcharges", TypeName = "int(11)")]
    public int? Apagcharges { get; set; }

    [Column("hasUppercut")]
    public bool? HasUppercut { get; set; }

    [Column("hasSecondWind")]
    public bool? HasSecondWind { get; set; }

    [Column("hasLuckyFind")]
    public bool? HasLuckyFind { get; set; }

    [Column("hasCheatDeath")]
    public bool? HasCheatDeath { get; set; }

    [Column("hasHeroicReturn")]
    public bool? HasHeroicReturn { get; set; }

    [Column("hasBreakThrough")]
    public bool? HasBreakThrough { get; set; }

    [Column("hasBrotherInArms")]
    public bool? HasBrotherInArms { get; set; }

    [Column("idLastUpdateInfoHeroicAction", TypeName = "int(11)")]
    public int? IdLastUpdateInfoHeroicAction { get; set; }

    [Column("houseDefense", TypeName = "int(11)")]
    public int? HouseDefense { get; set; }

    [Column("houseLevel", TypeName = "int(11)")]
    public int? HouseLevel { get; set; }

    [Column("hasAlarm")]
    public bool? HasAlarm { get; set; }

    [Column("chestLevel", TypeName = "int(11)")]
    public int? ChestLevel { get; set; }

    [Column("hasCurtain")]
    public bool? HasCurtain { get; set; }

    [Column("renfortLevel", TypeName = "int(11)")]
    public int? RenfortLevel { get; set; }

    [Column("hasFence")]
    public bool? HasFence { get; set; }

    [Column("kitchenLevel", TypeName = "int(11)")]
    public int? KitchenLevel { get; set; }

    [Column("laboLevel", TypeName = "int(11)")]
    public int? LaboLevel { get; set; }

    [Column("hasLock")]
    public bool? HasLock { get; set; }

    [Column("restLevel", TypeName = "int(11)")]
    public int? RestLevel { get; set; }

    [Column("idLastUpdateInfoHome", TypeName = "int(11)")]
    public int? IdLastUpdateInfoHome { get; set; }

    [Column("isCleanBody")]
    public bool? IsCleanBody { get; set; }

    [Column("isCamper")]
    public bool? IsCamper { get; set; }

    [Column("isAddict")]
    public bool? IsAddict { get; set; }

    [Column("isDrugged")]
    public bool? IsDrugged { get; set; }

    [Column("isDrunk")]
    public bool? IsDrunk { get; set; }

    [Column("isGhoul")]
    public bool? IsGhoul { get; set; }

    [Column("ghoulVoracity", TypeName = "int(11)")]
    public int? GhoulVoracity { get; set; }

    [Column("idLastUpdateInfoGhoulStatus", TypeName = "int(11)")]
    public int? IdLastUpdateInfoGhoulStatus { get; set; }

    [Column("isQuenched")]
    public bool? IsQuenched { get; set; }

    [Column("isConvalescent")]
    public bool? IsConvalescent { get; set; }

    [Column("isSated")]
    public bool? IsSated { get; set; }

    [Column("isCheatingDeathActive")]
    public bool? IsCheatingDeathActive { get; set; }

    [Column("isHungOver")]
    public bool? IsHungOver { get; set; }

    [Column("isImmune")]
    public bool? IsImmune { get; set; }

    [Column("isInfected")]
    public bool? IsInfected { get; set; }

    [Column("isTerrorised")]
    public bool? IsTerrorised { get; set; }

    [Column("isThirsty")]
    public bool? IsThirsty { get; set; }

    [Column("isDesy")]
    public bool? IsDesy { get; set; }

    [Column("isTired")]
    public bool? IsTired { get; set; }

    [Column("isHeadWounded")]
    public bool? IsHeadWounded { get; set; }

    [Column("isHandWounded")]
    public bool? IsHandWounded { get; set; }

    [Column("isArmWounded")]
    public bool? IsArmWounded { get; set; }

    [Column("isLegWounded")]
    public bool? IsLegWounded { get; set; }

    [Column("isEyeWounded")]
    public bool? IsEyeWounded { get; set; }

    [Column("isFootWounded")]
    public bool? IsFootWounded { get; set; }

    [Column("idLastUpdateInfoStatus", TypeName = "int(11)")]
    public int? IdLastUpdateInfoStatus { get; set; }

    [ForeignKey("IdBag")]
    [InverseProperty("TownCitizens")]
    public virtual Bag? IdBagNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfoGhoulStatus")]
    [InverseProperty("TownCitizenIdLastUpdateInfoGhoulStatusNavigations")]
    public virtual LastUpdateInfo? IdLastUpdateInfoGhoulStatusNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfoHeroicAction")]
    [InverseProperty("TownCitizenIdLastUpdateInfoHeroicActionNavigations")]
    public virtual LastUpdateInfo? IdLastUpdateInfoHeroicActionNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfoHome")]
    [InverseProperty("TownCitizenIdLastUpdateInfoHomeNavigations")]
    public virtual LastUpdateInfo? IdLastUpdateInfoHomeNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("TownCitizenIdLastUpdateInfoNavigations")]
    public virtual LastUpdateInfo IdLastUpdateInfoNavigation { get; set; } = null!;

    [ForeignKey("IdLastUpdateInfoStatus")]
    [InverseProperty("TownCitizenIdLastUpdateInfoStatusNavigations")]
    public virtual LastUpdateInfo? IdLastUpdateInfoStatusNavigation { get; set; }

    [ForeignKey("IdTown")]
    [InverseProperty("TownCitizens")]
    public virtual Town IdTownNavigation { get; set; } = null!;

    [ForeignKey("IdUser")]
    [InverseProperty("TownCitizens")]
    public virtual User IdUserNavigation { get; set; } = null!;
}
