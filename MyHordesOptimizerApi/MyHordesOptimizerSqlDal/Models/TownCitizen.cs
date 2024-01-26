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
    public string HomeMessage { get; set; }

    [Column("jobName", TypeName = "text")]
    public string JobName { get; set; }

    [Column("jobUID")]
    [StringLength(255)]
    public string JobUid { get; set; }

    [Column("positionX", TypeName = "int(11)")]
    public int? PositionX { get; set; }

    [Column("positionY", TypeName = "int(11)")]
    public int? PositionY { get; set; }

    [Column("isGhost", TypeName = "bit(1)")]
    public ulong? IsGhost { get; set; }

    [Column("dead", TypeName = "bit(1)")]
    public ulong? Dead { get; set; }

    [Column("idCadaver", TypeName = "int(11)")]
    public int? IdCadaver { get; set; }

    [Key]
    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int IdLastUpdateInfo { get; set; }

    [Column("avatar")]
    [StringLength(255)]
    public string Avatar { get; set; }

    [Column("idBag", TypeName = "int(11)")]
    public int? IdBag { get; set; }

    [Column("hasRescue", TypeName = "bit(1)")]
    public ulong? HasRescue { get; set; }

    [Column("APAGcharges", TypeName = "int(11)")]
    public int? Apagcharges { get; set; }

    [Column("hasUppercut", TypeName = "bit(1)")]
    public ulong? HasUppercut { get; set; }

    [Column("hasSecondWind", TypeName = "bit(1)")]
    public ulong? HasSecondWind { get; set; }

    [Column("hasLuckyFind", TypeName = "bit(1)")]
    public ulong? HasLuckyFind { get; set; }

    [Column("hasCheatDeath", TypeName = "bit(1)")]
    public ulong? HasCheatDeath { get; set; }

    [Column("hasHeroicReturn", TypeName = "bit(1)")]
    public ulong? HasHeroicReturn { get; set; }

    [Column("hasBreakThrough", TypeName = "bit(1)")]
    public ulong? HasBreakThrough { get; set; }

    [Column("hasBrotherInArms", TypeName = "bit(1)")]
    public ulong? HasBrotherInArms { get; set; }

    [Column("idLastUpdateInfoHeroicAction", TypeName = "int(11)")]
    public int? IdLastUpdateInfoHeroicAction { get; set; }

    [Column("houseDefense", TypeName = "int(11)")]
    public int? HouseDefense { get; set; }

    [Column("houseLevel", TypeName = "int(11)")]
    public int? HouseLevel { get; set; }

    [Column("hasAlarm", TypeName = "bit(1)")]
    public ulong? HasAlarm { get; set; }

    [Column("chestLevel", TypeName = "int(11)")]
    public int? ChestLevel { get; set; }

    [Column("hasCurtain", TypeName = "bit(1)")]
    public ulong? HasCurtain { get; set; }

    [Column("renfortLevel", TypeName = "int(11)")]
    public int? RenfortLevel { get; set; }

    [Column("hasFence", TypeName = "bit(1)")]
    public ulong? HasFence { get; set; }

    [Column("kitchenLevel", TypeName = "int(11)")]
    public int? KitchenLevel { get; set; }

    [Column("laboLevel", TypeName = "int(11)")]
    public int? LaboLevel { get; set; }

    [Column("hasLock", TypeName = "bit(1)")]
    public ulong? HasLock { get; set; }

    [Column("restLevel", TypeName = "int(11)")]
    public int? RestLevel { get; set; }

    [Column("idLastUpdateInfoHome", TypeName = "int(11)")]
    public int? IdLastUpdateInfoHome { get; set; }

    [Column("isCleanBody", TypeName = "bit(1)")]
    public ulong? IsCleanBody { get; set; }

    [Column("isCamper", TypeName = "bit(1)")]
    public ulong? IsCamper { get; set; }

    [Column("isAddict", TypeName = "bit(1)")]
    public ulong? IsAddict { get; set; }

    [Column("isDrugged", TypeName = "bit(1)")]
    public ulong? IsDrugged { get; set; }

    [Column("isDrunk", TypeName = "bit(1)")]
    public ulong? IsDrunk { get; set; }

    [Column("isGhoul", TypeName = "bit(1)")]
    public ulong? IsGhoul { get; set; }

    [Column("ghoulVoracity", TypeName = "int(11)")]
    public int? GhoulVoracity { get; set; }

    [Column("idLastUpdateInfoGhoulStatus", TypeName = "int(11)")]
    public int? IdLastUpdateInfoGhoulStatus { get; set; }

    [Column("isQuenched", TypeName = "bit(1)")]
    public ulong? IsQuenched { get; set; }

    [Column("isConvalescent", TypeName = "bit(1)")]
    public ulong? IsConvalescent { get; set; }

    [Column("isSated", TypeName = "bit(1)")]
    public ulong? IsSated { get; set; }

    [Column("isCheatingDeathActive", TypeName = "bit(1)")]
    public ulong? IsCheatingDeathActive { get; set; }

    [Column("isHungOver", TypeName = "bit(1)")]
    public ulong? IsHungOver { get; set; }

    [Column("isImmune", TypeName = "bit(1)")]
    public ulong? IsImmune { get; set; }

    [Column("isInfected", TypeName = "bit(1)")]
    public ulong? IsInfected { get; set; }

    [Column("isTerrorised", TypeName = "bit(1)")]
    public ulong? IsTerrorised { get; set; }

    [Column("isThirsty", TypeName = "bit(1)")]
    public ulong? IsThirsty { get; set; }

    [Column("isDesy", TypeName = "bit(1)")]
    public ulong? IsDesy { get; set; }

    [Column("isTired", TypeName = "bit(1)")]
    public ulong? IsTired { get; set; }

    [Column("isHeadWounded", TypeName = "bit(1)")]
    public ulong? IsHeadWounded { get; set; }

    [Column("isHandWounded", TypeName = "bit(1)")]
    public ulong? IsHandWounded { get; set; }

    [Column("isArmWounded", TypeName = "bit(1)")]
    public ulong? IsArmWounded { get; set; }

    [Column("isLegWounded", TypeName = "bit(1)")]
    public ulong? IsLegWounded { get; set; }

    [Column("isEyeWounded", TypeName = "bit(1)")]
    public ulong? IsEyeWounded { get; set; }

    [Column("isFootWounded", TypeName = "bit(1)")]
    public ulong? IsFootWounded { get; set; }

    [Column("idLastUpdateInfoStatus", TypeName = "int(11)")]
    public int? IdLastUpdateInfoStatus { get; set; }

    [ForeignKey("IdBag")]
    [InverseProperty("TownCitizens")]
    public virtual Bag IdBagNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfoGhoulStatus")]
    [InverseProperty("TownCitizenIdLastUpdateInfoGhoulStatusNavigations")]
    public virtual LastUpdateInfo IdLastUpdateInfoGhoulStatusNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfoHeroicAction")]
    [InverseProperty("TownCitizenIdLastUpdateInfoHeroicActionNavigations")]
    public virtual LastUpdateInfo IdLastUpdateInfoHeroicActionNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfoHome")]
    [InverseProperty("TownCitizenIdLastUpdateInfoHomeNavigations")]
    public virtual LastUpdateInfo IdLastUpdateInfoHomeNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("TownCitizenIdLastUpdateInfoNavigations")]
    public virtual LastUpdateInfo IdLastUpdateInfoNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfoStatus")]
    [InverseProperty("TownCitizenIdLastUpdateInfoStatusNavigations")]
    public virtual LastUpdateInfo IdLastUpdateInfoStatusNavigation { get; set; }

    [ForeignKey("IdTown")]
    [InverseProperty("TownCitizens")]
    public virtual Town IdTownNavigation { get; set; }

    [ForeignKey("IdUser")]
    [InverseProperty("TownCitizens")]
    public virtual User IdUserNavigation { get; set; }
}
