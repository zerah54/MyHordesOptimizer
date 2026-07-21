using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("MapCell")]
[Index("IdLastUpdateInfo", Name = "idLastUpdateInfo")]
[Index("IdRuin", Name = "idRuin")]
[Index("IdTown", "X", "Y", Name = "idTown", IsUnique = true)]
public partial class MapCell
{
    [Key]
    [Column("idCell", TypeName = "int(11)")]
    public int IdCell { get; set; }

    [Column("idTown", TypeName = "int(11)")]
    public int? IdTown { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [Column("x", TypeName = "int(11)")]
    public int X { get; set; }

    [Column("y", TypeName = "int(11)")]
    public int Y { get; set; }

    [Column("nbKm", TypeName = "int(11)")]
    public int? NbKm { get; set; }

    [Column("nbPa", TypeName = "int(11)")]
    public int? NbPa { get; set; }

    [Column("zoneRegen", TypeName = "int(11)")]
    public int? ZoneRegen { get; set; }

    [Column("isTown")]
    public bool? IsTown { get; set; }

    [Column("isVisitedToday")]
    public bool? IsVisitedToday { get; set; }

    [Column("isNeverVisited")]
    public bool? IsNeverVisited { get; set; }

    [Column("dangerLevel", TypeName = "int(11)")]
    public int? DangerLevel { get; set; }

    [Column("idRuin", TypeName = "int(11)")]
    public int? IdRuin { get; set; }

    [Column("isDryed")]
    public bool? IsDryed { get; set; }

    [Column("nbZombie", TypeName = "int(11)")]
    public int? NbZombie { get; set; }

    [Column("nbZombieKilled", TypeName = "int(11)")]
    public int? NbZombieKilled { get; set; }

    [Column("nbHero", TypeName = "int(11)")]
    public int? NbHero { get; set; }

    [Column("isRuinCamped")]
    public bool? IsRuinCamped { get; set; }

    [Column("isRuinDryed")]
    public bool? IsRuinDryed { get; set; }

    [Column("nbRuinDig", TypeName = "int(11)")]
    public int? NbRuinDig { get; set; }

    [Column("averagePotentialRemainingDig")]
    public float? AveragePotentialRemainingDig { get; set; }

    [Column("maxPotentialRemainingDig", TypeName = "int(11)")]
    public int? MaxPotentialRemainingDig { get; set; }

    [Column("note", TypeName = "text")]
    public string? Note { get; set; }

    /// <summary>Niveau d'abondance de la zone (0-3) relevé par un Fouineur présent sur la case. 0 = zone épuisée.</summary>
    [Column("scavZoneLevel", TypeName = "int(11)")]
    public int? ScavZoneLevel { get; set; }

    /// <summary>Niveau d'exploration de la zone (0-3) relevé par un Éclaireur présent sur la case.</summary>
    [Column("scoutZoneLevel", TypeName = "int(11)")]
    public int? ScoutZoneLevel { get; set; }

    /// <summary>Estimation bruitée du nombre de zombies, issue du radar d'un Éclaireur situé sur une case voisine.</summary>
    [Column("scoutEstimationZombie", TypeName = "int(11)")]
    public int? ScoutEstimationZombie { get; set; }

    /// <summary>Fraîcheur propre à <see cref="ScoutEstimationZombie"/>, à comparer à <see cref="IdLastUpdateInfo"/>.</summary>
    [Column("idScoutEstimationLastUpdateInfo", TypeName = "int(11)")]
    public int? IdScoutEstimationLastUpdateInfo { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("MapCells")]
    public virtual LastUpdateInfo? IdLastUpdateInfoNavigation { get; set; }

    [ForeignKey("IdScoutEstimationLastUpdateInfo")]
    [InverseProperty("ScoutEstimationMapCells")]
    public virtual LastUpdateInfo? IdScoutEstimationLastUpdateInfoNavigation { get; set; }

    [ForeignKey("IdRuin")]
    [InverseProperty("MapCells")]
    public virtual Ruin? IdRuinNavigation { get; set; }

    [ForeignKey("IdTown")]
    [InverseProperty("MapCells")]
    public virtual Town? IdTownNavigation { get; set; }

    [InverseProperty("IdCellNavigation")]
    public virtual ICollection<MapCellDig> MapCellDigs { get; set; } = new List<MapCellDig>();

    [InverseProperty("IdCellNavigation")]
    public virtual ICollection<MapCellItem> MapCellItems { get; set; } = new List<MapCellItem>();
}
